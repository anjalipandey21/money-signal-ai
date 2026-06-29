import os
from pathlib import Path

from dotenv import load_dotenv

API_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = API_ROOT / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=False)


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)

    if raw is None or raw == "":
        return default

    try:
        return int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer") from exc


def _float_env(name: str, default: float) -> float:
    raw = os.getenv(name)

    if raw is None or raw == "":
        return default

    try:
        return float(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be a number") from exc


def _bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)

    if raw is None or raw == "":
        return default

    return raw.lower() in {"1", "true", "yes", "on"}


def _list_env(name: str, default: list[str]) -> list[str]:
    raw = os.getenv(name)

    if raw is None or raw.strip() == "":
        return default

    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL")

        if not self.DATABASE_URL:
            raise ValueError(
                f"DATABASE_URL is missing. Expected it in: {ENV_PATH}"
            )

        self.MARKET_DATA_PROVIDER = os.getenv("MARKET_DATA_PROVIDER", "auto")
        self.ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
        self.CORS_ORIGINS = _list_env(
            "CORS_ORIGINS",
            ["http://localhost:3000", "http://127.0.0.1:3000"],
        )
        self.API_PREFIX = os.getenv("API_PREFIX", "/api")
        self.API_VERSION = os.getenv("API_VERSION", "v1")
        self.API_V1_PREFIX = os.getenv(
            "API_V1_PREFIX",
            f"{self.API_PREFIX}/{self.API_VERSION}",
        )
        self.ENABLE_LEGACY_API_PREFIX = _bool_env(
            "ENABLE_LEGACY_API_PREFIX",
            True,
        )
        self.REQUIRE_DB_ON_STARTUP = _bool_env(
            "REQUIRE_DB_ON_STARTUP",
            False,
        )
        self.CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
        self.CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY")
        self.CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")
        self.CLERK_ISSUER = os.getenv("CLERK_ISSUER")
        self.CLERK_JWKS_URL = os.getenv(
            "CLERK_JWKS_URL",
            "",
        )
        self.CLERK_AUTH_DEBUG = _bool_env("CLERK_AUTH_DEBUG", False)
        self.ALLOW_DEV_AUTH = _bool_env("ALLOW_DEV_AUTH", False)

        self.MARKET_DATA_CACHE_TTL_SECONDS = _int_env(
            "MARKET_DATA_CACHE_TTL_SECONDS",
            15 * 60,
        )

        self.MARKET_DATA_REQUEST_TIMEOUT_SECONDS = _int_env(
            "MARKET_DATA_REQUEST_TIMEOUT_SECONDS",
            20,
        )

        self.SEC_USER_AGENT = os.getenv(
            "SEC_USER_AGENT",
            "MoneySignalAI/0.1 contact@example.com",
        )

        self.SEC_REQUEST_TIMEOUT_SECONDS = _int_env(
            "SEC_REQUEST_TIMEOUT_SECONDS",
            15,
        )

        self.SEC_MAX_RETRIES = _int_env(
            "SEC_MAX_RETRIES",
            3,
        )

        self.SEC_BACKOFF_BASE_SECONDS = _float_env(
            "SEC_BACKOFF_BASE_SECONDS",
            1.0,
        )

        self.SEC_MIN_REQUEST_INTERVAL_SECONDS = _float_env(
            "SEC_MIN_REQUEST_INTERVAL_SECONDS",
            0.2,
        )

        self.SEC_MAX_FILINGS = _int_env(
            "SEC_MAX_FILINGS",
            25,
        )

        self.SCHEDULER_ENABLED = _bool_env("SCHEDULER_ENABLED", False)

        self.SCRAPER_SCHEDULE_HOURS = _int_env(
            "SCRAPER_SCHEDULE_HOURS",
            6,
        )

        self.SCRAPER_DAYS_BACK = _int_env(
            "SCRAPER_DAYS_BACK",
            30,
        )

        self.SCRAPER_MAX_FILINGS = _int_env(
            "SCRAPER_MAX_FILINGS",
            10,
        )

        self.SCRAPER_13F_MAX_FILINGS = _int_env(
            "SCRAPER_13F_MAX_FILINGS",
            3,
        )

        self.SCRAPER_REFRESH_MARKET = _bool_env(
            "SCRAPER_REFRESH_MARKET",
            True,
        )

        self.SCRAPER_COOLDOWN_HOURS = _int_env(
            "SCRAPER_COOLDOWN_HOURS",
            6,
        )

        self.INGESTION_MAX_RUNTIME_SECONDS = _int_env(
            "INGESTION_MAX_RUNTIME_SECONDS",
            1200,
        )

settings = Settings()
