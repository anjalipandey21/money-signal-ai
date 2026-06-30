from datetime import datetime, timedelta
from decimal import Decimal
from math import isfinite
from time import perf_counter, sleep
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen
import json
import logging
import re

from sqlalchemy.orm import Session

from app.core.cache import invalidate_market_caches
from app.core.config import settings
from app.models import Company, MarketSnapshot


logger = logging.getLogger(__name__)

ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"
SNAPSHOT_DEDUPE_WINDOW_SECONDS = 60


class MarketDataError(Exception):
    pass


class MarketQuoteValidationError(MarketDataError):
    def __init__(self, reason: str, message: str | None = None):
        self.reason = reason
        super().__init__(message or reason)


def _safe_error(error: Exception | str, max_length: int = 180) -> str:
    message = str(error).replace("\n", " ").replace("\r", " ").strip()

    if len(message) <= max_length:
        return message

    return f"{message[:max_length].rstrip()}..."


def _to_float(value: Any):
    if value is None:
        return None

    try:
        parsed = float(str(value).replace("%", "").replace(",", "").strip())
    except (TypeError, ValueError):
        return None

    if not isfinite(parsed):
        return None

    return parsed


def _to_decimal(value: Any):
    parsed = _to_float(value)

    if parsed is None:
        return None

    return Decimal(str(round(parsed, 4)))


def get_market_ticker_skip_reason(ticker: str | None, exchange: str | None = None) -> str | None:
    symbol = (ticker or "").strip().upper()

    if not symbol:
        return "missing_ticker"

    if len(symbol) > 8:
        return "unsupported_ticker"

    if re.search(r"[\s/=^]", symbol):
        return "invalid_ticker"

    if symbol.endswith((".W", ".WS", ".U")):
        return "unsupported_ticker"

    if symbol.endswith(("WS", "WT")):
        return "unsupported_ticker"

    if len(symbol) > 1 and symbol.endswith(("W", "U", "R")):
        return "unsupported_ticker"

    exchange_value = (exchange or "").strip().upper()
    blocked_exchange_tokens = {"OTC", "PINK", "GREY", "OTCMKTS", "OTCQB", "OTCQX"}

    if any(token in exchange_value for token in blocked_exchange_tokens):
        return "otc_ticker"

    return None


def normalize_market_symbol(ticker: str) -> str:
    symbol = ticker.strip().upper()
    reason = get_market_ticker_skip_reason(symbol)

    if reason:
        raise MarketQuoteValidationError(reason, f"{symbol or 'Ticker'} is not supported for market refresh")

    return symbol


def _provider_order() -> list[str]:
    provider = (settings.MARKET_DATA_PROVIDER or "auto").lower().strip()
    available = ["yfinance"]

    if settings.ALPHA_VANTAGE_API_KEY:
        available.append("alpha_vantage")

    if provider == "auto":
        return available

    if provider in {"yfinance", "alpha_vantage"}:
        return [provider, *[item for item in available if item != provider]]

    raise MarketDataError(
        "MARKET_DATA_PROVIDER must be one of: auto, yfinance, alpha_vantage"
    )


def _fetch_yfinance_quote(ticker: str) -> dict[str, Any]:
    try:
        import yfinance as yf
    except ImportError as exc:
        raise MarketDataError(
            "yfinance is not installed. Run: pip install -r apps/api/requirements.txt"
        ) from exc

    try:
        stock = yf.Ticker(ticker)
        fast_info = getattr(stock, "fast_info", {}) or {}

        def fast_get(*keys):
            for key in keys:
                try:
                    value = fast_info.get(key)
                except AttributeError:
                    value = getattr(fast_info, key, None)

                if value is not None:
                    return value

            return None

        history = stock.history(
            period="5d",
            interval="1d",
            auto_adjust=False,
            timeout=settings.MARKET_REQUEST_TIMEOUT_SECONDS,
        )

        close_values = []
        volume_values = []
        market_time = None

        if history is not None and not history.empty and "Close" in history:
            close_series = history["Close"].dropna()
            close_values = [float(value) for value in close_series.tolist()]

            if "Volume" in history:
                volume_values = [int(value) for value in history["Volume"].fillna(0).tolist()]

            last_index = close_series.index[-1] if len(close_series) else None

            if last_index is not None and hasattr(last_index, "to_pydatetime"):
                market_time = last_index.to_pydatetime().replace(tzinfo=None)

        price = _to_float(
            fast_get("lastPrice", "last_price", "regularMarketPrice")
        )

        if price is None and close_values:
            price = close_values[-1]

        previous_close = _to_float(
            fast_get(
                "previousClose",
                "previous_close",
                "regularMarketPreviousClose",
            )
        )

        if previous_close is None and len(close_values) >= 2:
            previous_close = close_values[-2]

        change_amount = None
        change_percent = None

        if previous_close and previous_close != 0 and price is not None:
            change_amount = price - previous_close
            change_percent = (change_amount / previous_close) * 100

        volume = _to_float(fast_get("lastVolume", "regularMarketVolume", "volume"))

        if volume is None and volume_values:
            volume = volume_values[-1]

        currency = fast_get("currency") or "USD"

        return {
            "ticker": ticker,
            "price": price,
            "changeAmount": change_amount,
            "changePercent": change_percent,
            "volume": int(volume) if volume is not None else None,
            "currency": currency,
            "provider": "yfinance",
            "marketTime": market_time,
            "marketStatus": None,
            "rawPayload": {
                "last_price": price,
                "previous_close": previous_close,
                "currency": currency,
                "volume": volume,
            },
        }

    except MarketDataError:
        raise

    except Exception as exc:
        raise MarketDataError(
            f"Yahoo Finance fetch failed for {ticker}: {_safe_error(exc)}"
        ) from exc


def _fetch_alpha_vantage_global_quote(ticker: str) -> dict[str, Any]:
    if not settings.ALPHA_VANTAGE_API_KEY:
        raise MarketDataError("ALPHA_VANTAGE_API_KEY is not configured")

    query = urlencode(
        {
            "function": "GLOBAL_QUOTE",
            "symbol": ticker,
            "apikey": settings.ALPHA_VANTAGE_API_KEY,
        }
    )

    url = f"{ALPHA_VANTAGE_BASE_URL}?{query}"

    try:
        with urlopen(
            url,
            timeout=settings.MARKET_REQUEST_TIMEOUT_SECONDS,
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise MarketDataError(
            f"Alpha Vantage request failed for {ticker}: {_safe_error(exc)}"
        ) from exc

    if "Note" in payload:
        raise MarketDataError(_safe_error(payload["Note"]))

    if "Information" in payload:
        raise MarketDataError(_safe_error(payload["Information"]))

    quote = payload.get("Global Quote")

    if not quote:
        raise MarketDataError(f"No Alpha Vantage quote returned for {ticker}")

    latest_trading_day = quote.get("07. latest trading day")
    market_time = None

    if latest_trading_day:
        try:
            market_time = datetime.fromisoformat(latest_trading_day)
        except ValueError:
            market_time = None

    return {
        "ticker": ticker,
        "price": _to_float(quote.get("05. price")),
        "changeAmount": _to_float(quote.get("09. change")),
        "changePercent": _to_float(quote.get("10. change percent")),
        "volume": int(_to_float(quote.get("06. volume")) or 0) or None,
        "currency": "USD",
        "provider": "alpha_vantage",
        "marketTime": market_time,
        "marketStatus": None,
        "rawPayload": quote,
    }


def _validate_normalized_quote(quote: dict[str, Any]) -> None:
    if not quote.get("ticker"):
        raise MarketQuoteValidationError("missing_ticker")

    price = _to_float(quote.get("price"))

    if price is None:
        raise MarketQuoteValidationError("missing_price")

    if price <= 0:
        raise MarketQuoteValidationError("zero_or_negative_price")

    if not quote.get("provider"):
        raise MarketQuoteValidationError("missing_provider")

    if not quote.get("fetchedAt"):
        raise MarketQuoteValidationError("missing_fetched_at")


def _normalize_quote(raw_quote: dict[str, Any], provider: str, ticker: str, latency_ms: float) -> dict[str, Any]:
    fetched_at = datetime.utcnow()
    market_time = raw_quote.get("marketTime") or raw_quote.get("market_time")
    provider_name = raw_quote.get("provider") or provider
    quote = {
        "ticker": raw_quote.get("ticker") or raw_quote.get("symbol") or ticker,
        "price": _to_float(raw_quote.get("price")),
        "changeAmount": _to_float(raw_quote.get("changeAmount", raw_quote.get("change_amount"))),
        "changePercent": _to_float(raw_quote.get("changePercent", raw_quote.get("change_percent"))),
        "volume": raw_quote.get("volume"),
        "currency": raw_quote.get("currency") or "USD",
        "provider": provider_name,
        "fetchedAt": fetched_at,
        "marketTime": market_time,
        "marketStatus": raw_quote.get("marketStatus"),
        "isStale": False,
        "latencyMs": round(latency_ms, 2),
        "rawPayload": raw_quote.get("rawPayload") or raw_quote.get("raw_payload"),
    }

    _validate_normalized_quote(quote)

    return quote


def _fetch_provider_quote(provider: str, symbol: str) -> dict[str, Any]:
    if provider == "yfinance":
        return _fetch_yfinance_quote(symbol)

    if provider == "alpha_vantage":
        return _fetch_alpha_vantage_global_quote(symbol)

    raise MarketDataError(f"Unsupported market data provider: {provider}")


def fetch_market_quote(ticker: str) -> dict[str, Any]:
    symbol = normalize_market_symbol(ticker)
    errors: list[str] = []
    attempts: list[dict[str, Any]] = []

    for provider in _provider_order():
        max_attempts = max(1, settings.MARKET_MAX_RETRIES + 1)

        for attempt_number in range(1, max_attempts + 1):
            started = perf_counter()

            try:
                raw_quote = _fetch_provider_quote(provider, symbol)
                latency_ms = (perf_counter() - started) * 1000
                quote = _normalize_quote(raw_quote, provider, symbol, latency_ms)
                attempts.append(
                    {
                        "provider": provider,
                        "status": "success",
                        "attempt": attempt_number,
                        "latencyMs": quote["latencyMs"],
                    }
                )
                quote["providerAttempts"] = attempts
                quote["providerFallbackCount"] = max(0, len({item["provider"] for item in attempts}) - 1)
                quote["providerFailureCount"] = len(
                    [item for item in attempts if item.get("status") == "failed"]
                )
                return quote

            except MarketDataError as exc:
                latency_ms = (perf_counter() - started) * 1000
                message = _safe_error(exc)
                errors.append(f"{provider}: {message}")
                attempts.append(
                    {
                        "provider": provider,
                        "status": "failed",
                        "attempt": attempt_number,
                        "latencyMs": round(latency_ms, 2),
                        "error": message,
                    }
                )
                logger.debug("Market provider failed for %s: %s", symbol, message)

                if attempt_number < max_attempts:
                    sleep(settings.MARKET_BACKOFF_BASE_SECONDS * attempt_number)

    raise MarketDataError(
        "; ".join(errors) or f"No market data provider available for {symbol}"
    )


def get_latest_market_snapshot(db: Session, company_id: int):
    return (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.company_id == company_id)
        .order_by(MarketSnapshot.fetched_at.desc())
        .first()
    )


def is_market_snapshot_stale(snapshot: MarketSnapshot | None) -> bool:
    if not snapshot or not snapshot.fetched_at:
        return True

    ttl = timedelta(seconds=settings.MARKET_DATA_CACHE_TTL_SECONDS)

    return datetime.utcnow() - snapshot.fetched_at > ttl


def _snapshot_age_minutes(snapshot: MarketSnapshot | None) -> float | None:
    if not snapshot or not snapshot.fetched_at:
        return None

    return round((datetime.utcnow() - snapshot.fetched_at).total_seconds() / 60, 2)


def refresh_market_snapshot(db: Session, ticker: str) -> MarketSnapshot:
    symbol = normalize_market_symbol(ticker)

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise MarketDataError(f"{symbol} is not currently tracked")

    quote = fetch_market_quote(symbol)
    latest = get_latest_market_snapshot(db, company.id)

    if (
        latest
        and latest.fetched_at
        and latest.provider == quote.get("provider")
        and datetime.utcnow() - latest.fetched_at <= timedelta(seconds=SNAPSHOT_DEDUPE_WINDOW_SECONDS)
    ):
        return latest

    snapshot = MarketSnapshot(
        company_id=company.id,
        symbol=symbol,
        price=_to_decimal(quote.get("price")),
        change_amount=_to_decimal(quote.get("changeAmount")),
        change_percent=_to_decimal(quote.get("changePercent")),
        currency=quote.get("currency") or "USD",
        provider=quote.get("provider") or "unknown",
        market_time=quote.get("marketTime"),
        fetched_at=quote.get("fetchedAt") or datetime.utcnow(),
        raw_payload={
            "price": quote.get("price"),
            "changeAmount": quote.get("changeAmount"),
            "changePercent": quote.get("changePercent"),
            "volume": quote.get("volume"),
            "marketStatus": quote.get("marketStatus"),
            "latencyMs": quote.get("latencyMs"),
            "providerAttempts": quote.get("providerAttempts"),
            "providerFallbackCount": quote.get("providerFallbackCount"),
            "providerFailureCount": quote.get("providerFailureCount"),
            "raw": quote.get("rawPayload"),
        },
    )

    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    invalidate_market_caches()

    return snapshot


def get_or_refresh_market_snapshot(
    db: Session,
    company: Company,
    force_refresh: bool = False,
):
    snapshot = get_latest_market_snapshot(db, company.id)

    if snapshot and not force_refresh and not is_market_snapshot_stale(snapshot):
        return snapshot

    try:
        return refresh_market_snapshot(db, company.ticker)

    except MarketDataError:
        if snapshot:
            return snapshot

        raise


def format_market_snapshot(snapshot: MarketSnapshot | None):
    if not snapshot or snapshot.price is None:
        return {
            "price": "$--",
            "changeAmount": "0.00",
            "changePercent": "0.00%",
            "marketProvider": None,
            "priceFetchedAt": None,
            "marketTime": None,
            "marketStatus": None,
            "isStale": True,
            "staleAfterMinutes": settings.MARKET_QUOTE_STALE_MINUTES,
            "quoteAgeMinutes": None,
        }

    change_amount = float(snapshot.change_amount or 0)
    change_percent = float(snapshot.change_percent or 0)
    quote_age_minutes = _snapshot_age_minutes(snapshot)
    is_stale = (
        quote_age_minutes is None
        or quote_age_minutes > settings.MARKET_QUOTE_STALE_MINUTES
    )
    raw_payload = snapshot.raw_payload if isinstance(snapshot.raw_payload, dict) else {}

    return {
        "price": f"${float(snapshot.price):,.2f}",
        "changeAmount": f"{change_amount:+.2f}",
        "changePercent": f"{change_percent:+.2f}%",
        "marketProvider": snapshot.provider,
        "priceFetchedAt": snapshot.fetched_at.isoformat()
        if snapshot.fetched_at
        else None,
        "marketTime": snapshot.market_time.isoformat()
        if snapshot.market_time
        else None,
        "marketStatus": raw_payload.get("marketStatus"),
        "isStale": is_stale,
        "staleAfterMinutes": settings.MARKET_QUOTE_STALE_MINUTES,
        "quoteAgeMinutes": quote_age_minutes,
    }


def get_price_history(ticker: str, days: int = 30) -> list[dict]:
    import yfinance as yf

    symbol = normalize_market_symbol(ticker)

    if days <= 7:
        period = "7d"
        interval = "1d"
    elif days <= 30:
        period = "1mo"
        interval = "1d"
    elif days <= 90:
        period = "3mo"
        interval = "1d"
    elif days <= 180:
        period = "6mo"
        interval = "1d"
    else:
        period = "1y"
        interval = "1d"

    ticker_obj = yf.Ticker(symbol)
    history = ticker_obj.history(
        period=period,
        interval=interval,
        timeout=settings.MARKET_REQUEST_TIMEOUT_SECONDS,
    )

    if history.empty:
        return []

    result = []

    for date, row in history.iterrows():
        result.append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if row["Volume"] else 0,
            }
        )

    return result

