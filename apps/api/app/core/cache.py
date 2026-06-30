import json
import logging
from collections import OrderedDict
from datetime import date, datetime
from decimal import Decimal
from threading import Lock
from time import monotonic
from typing import Any, Callable

from app.core.config import settings

logger = logging.getLogger(__name__)


def _json_default(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    raise TypeError(f"{type(value).__name__} is not JSON serializable")


def _json_dumps(value: Any) -> str:
    return json.dumps(value, default=_json_default, separators=(",", ":"))


def _json_loads(value: str | bytes | None) -> Any:
    if value is None:
        return None

    if isinstance(value, bytes):
        value = value.decode("utf-8")

    return json.loads(value)


class InMemoryTTLCache:
    def __init__(self, max_items: int):
        self.max_items = max(1, max_items)
        self._items: OrderedDict[str, tuple[float | None, Any]] = OrderedDict()
        self._lock = Lock()
        self.evictions = 0

    def get(self, key: str) -> Any:
        now = monotonic()

        with self._lock:
            item = self._items.get(key)

            if not item:
                return None

            expires_at, value = item

            if expires_at is not None and expires_at <= now:
                self._items.pop(key, None)
                return None

            self._items.move_to_end(key)
            return value

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        expires_at = monotonic() + ttl_seconds if ttl_seconds else None

        with self._lock:
            self._items[key] = (expires_at, value)
            self._items.move_to_end(key)

            while len(self._items) > self.max_items:
                self._items.popitem(last=False)
                self.evictions += 1

    def delete(self, key: str) -> None:
        with self._lock:
            self._items.pop(key, None)

    def delete_many(self, keys: list[str]) -> None:
        with self._lock:
            for key in keys:
                self._items.pop(key, None)

    def clear_namespace(self, prefix: str) -> int:
        with self._lock:
            keys = [key for key in self._items if key.startswith(prefix)]

            for key in keys:
                self._items.pop(key, None)

            return len(keys)

    def item_count(self) -> int:
        with self._lock:
            return len(self._items)

    def namespace_counts(self) -> dict[str, int]:
        counts: dict[str, int] = {}

        with self._lock:
            for key in self._items:
                namespace = key.split(":", 2)[1] if ":" in key else "default"
                counts[namespace] = counts.get(namespace, 0) + 1

        return counts


class CacheManager:
    def __init__(self):
        self.enabled = settings.CACHE_ENABLED
        self.key_prefix = settings.CACHE_KEY_PREFIX.strip(":") or "moneysignal"
        self._memory = InMemoryTTLCache(settings.CACHE_MAX_ITEMS)
        self._redis = None
        self._redis_available = False
        self._redis_checked = False
        self._locks: dict[str, Lock] = {}
        self._locks_guard = Lock()
        self._stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
            "evictions": 0,
            "errors": 0,
        }

    def _inc(self, key: str, amount: int = 1) -> None:
        self._stats[key] = self._stats.get(key, 0) + amount

    def _redis_configured(self) -> bool:
        return bool(settings.REDIS_URL) and settings.CACHE_BACKEND in {"auto", "redis"}

    def _get_redis(self):
        if not self.enabled or not self._redis_configured():
            return None

        if self._redis is not None:
            return self._redis

        try:
            import redis

            self._redis = redis.Redis.from_url(
                settings.REDIS_URL,
                socket_timeout=settings.CACHE_REDIS_SOCKET_TIMEOUT_SECONDS,
                socket_connect_timeout=settings.CACHE_REDIS_CONNECT_TIMEOUT_SECONDS,
                decode_responses=False,
            )
            return self._redis
        except Exception as error:
            self._inc("errors")
            logger.warning("Redis cache initialization failed: %s", str(error))
            return None

    def _ensure_redis_available(self) -> bool:
        redis_client = self._get_redis()

        if redis_client is None:
            self._redis_available = False
            self._redis_checked = True
            return False

        if self._redis_checked:
            return self._redis_available

        try:
            redis_client.ping()
            self._redis_available = True
        except Exception as error:
            self._inc("errors")
            self._redis_available = False
            logger.warning("Redis cache ping failed; using memory fallback: %s", str(error))

        self._redis_checked = True
        return self._redis_available

    def backend_name(self) -> str:
        if not self.enabled:
            return "disabled"

        if self._ensure_redis_available():
            return "redis"

        return "in_memory"

    def build_key(self, namespace: str, parts: Any = None) -> str:
        if isinstance(parts, dict):
            normalized_parts = {
                str(key): parts[key]
                for key in sorted(parts)
                if parts[key] is not None
            }
        elif isinstance(parts, set):
            normalized_parts = sorted(parts)
        elif isinstance(parts, (list, tuple)):
            normalized_parts = list(parts)
        else:
            normalized_parts = parts

        payload = _json_dumps(normalized_parts)
        return f"{self.key_prefix}:{namespace}:{payload}"

    def get(self, key: str) -> Any:
        if not self.enabled:
            return None

        try:
            if self._ensure_redis_available():
                value = self._redis.get(key)
                if value is None:
                    self._inc("misses")
                    return None

                self._inc("hits")
                return _json_loads(value)

            value = self._memory.get(key)
            self._inc("hits" if value is not None else "misses")
            return value
        except Exception as error:
            self._inc("errors")
            logger.warning("Cache get failed for key %s: %s", key, str(error))
            return None

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        if not self.enabled:
            return

        ttl_seconds = ttl_seconds or settings.CACHE_DEFAULT_TTL_SECONDS

        try:
            if self._ensure_redis_available():
                self._redis.setex(key, ttl_seconds, _json_dumps(value))
            else:
                self._memory.set(key, value, ttl_seconds)

            self._inc("sets")
        except Exception as error:
            self._inc("errors")
            logger.warning("Cache set failed for key %s: %s", key, str(error))

    def delete(self, key: str) -> None:
        self.delete_many([key])

    def delete_many(self, keys: list[str]) -> None:
        if not self.enabled or not keys:
            return

        try:
            if self._ensure_redis_available():
                self._redis.delete(*keys)
            else:
                self._memory.delete_many(keys)

            self._inc("deletes", len(keys))
        except Exception as error:
            self._inc("errors")
            logger.warning("Cache delete_many failed: %s", str(error))

    def clear_namespace(self, namespace: str) -> int:
        if not self.enabled:
            return 0

        prefix = f"{self.key_prefix}:{namespace}:"

        try:
            if self._ensure_redis_available():
                deleted = 0
                cursor = 0

                while True:
                    cursor, keys = self._redis.scan(
                        cursor=cursor,
                        match=f"{prefix}*",
                        count=100,
                    )

                    if keys:
                        self._redis.delete(*keys)
                        deleted += len(keys)

                    if cursor == 0:
                        break

                self._inc("deletes", deleted)
                return deleted

            deleted = self._memory.clear_namespace(prefix)
            self._inc("deletes", deleted)
            return deleted
        except Exception as error:
            self._inc("errors")
            logger.warning("Cache namespace clear failed for %s: %s", namespace, str(error))
            return 0

    def get_or_set(
        self,
        key: str,
        producer: Callable[[], Any],
        ttl_seconds: int | None = None,
    ) -> Any:
        cached = self.get(key)

        if cached is not None:
            return cached

        with self._locks_guard:
            lock = self._locks.setdefault(key, Lock())

        with lock:
            cached = self.get(key)

            if cached is not None:
                return cached

            value = producer()

            if value is not None:
                self.set(key, value, ttl_seconds)

            return value

    def invalidate_namespaces(self, namespaces: list[str]) -> None:
        for namespace in namespaces:
            self.clear_namespace(namespace)

    def stats(self) -> dict[str, Any]:
        stats = dict(self._stats)
        stats["evictions"] = self._memory.evictions
        return stats

    def health(self) -> dict[str, Any]:
        backend = self.backend_name()

        return {
            "enabled": self.enabled,
            "backend": backend,
            "redisConfigured": self._redis_configured(),
            "redisAvailable": self._redis_available,
            "keyPrefix": self.key_prefix,
            "itemCount": self._memory.item_count() if backend == "in_memory" else None,
            "maxItems": settings.CACHE_MAX_ITEMS,
            "stats": self.stats(),
            "namespaceStats": self._memory.namespace_counts()
            if backend == "in_memory"
            else {},
            "ttlSettings": {
                "default": settings.CACHE_DEFAULT_TTL_SECONDS,
                "dashboard": settings.DASHBOARD_CACHE_TTL_SECONDS,
                "stocksList": settings.STOCKS_LIST_CACHE_TTL_SECONDS,
                "stockDetail": settings.STOCK_DETAIL_CACHE_TTL_SECONDS,
                "quotesRead": settings.QUOTES_READ_CACHE_TTL_SECONDS,
                "marketSummary": settings.MARKET_SUMMARY_CACHE_TTL_SECONDS,
            },
        }


cache = CacheManager()


def invalidate_market_caches() -> None:
    cache.invalidate_namespaces(["quotes", "market", "stocks", "dashboard"])


def invalidate_ingestion_caches(
    *,
    market_changed: bool = False,
    signals_changed: bool = False,
    universe_changed: bool = False,
) -> None:
    namespaces = ["scraper"]

    if market_changed:
        namespaces.extend(["quotes", "market", "stocks", "dashboard"])

    if signals_changed:
        namespaces.extend(["dashboard", "stocks", "signals", "summaries"])

    if universe_changed:
        namespaces.extend(["stocks", "dashboard"])

    cache.invalidate_namespaces(sorted(set(namespaces)))


