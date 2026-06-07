import os
from pathlib import Path

from dotenv import load_dotenv

API_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = API_ROOT / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)

    if raw is None or raw == "":
        return default

    try:
        return int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer") from exc


class Settings:
    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL")

        if not self.DATABASE_URL:
            raise ValueError(
                f"DATABASE_URL is missing. Expected it in: {ENV_PATH}"
            )

        self.MARKET_DATA_PROVIDER = os.getenv("MARKET_DATA_PROVIDER", "auto")
        self.ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

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
            "MoneySignalAI/0.1 your_email@example.com",
        )

        self.SEC_REQUEST_TIMEOUT_SECONDS = _int_env(
            "SEC_REQUEST_TIMEOUT_SECONDS",
            20,
        )

        self.SEC_MAX_FILINGS = _int_env(
            "SEC_MAX_FILINGS",
            25,
        )

        self.SCHEDULER_ENABLED = os.getenv("SCHEDULER_ENABLED", "false").lower() == "true"

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

        self.SCRAPER_COOLDOWN_HOURS = _int_env(
            "SCRAPER_COOLDOWN_HOURS",
            6,
        )

settings = Settings()