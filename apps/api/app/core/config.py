import os
from pathlib import Path

from dotenv import load_dotenv

API_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = API_ROOT / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)


class Settings:
    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL")

        if not self.DATABASE_URL:
            raise ValueError(
                f"DATABASE_URL is missing. Expected it in: {ENV_PATH}"
            )


settings = Settings()