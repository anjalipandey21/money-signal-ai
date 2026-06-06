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


settings = Settings()