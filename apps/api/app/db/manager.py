import time
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.database import engine


def _database_dialect() -> str:
    try:
        return make_url(settings.DATABASE_URL).get_backend_name() or "unknown"
    except Exception:
        return "unknown"


def mask_database_url(database_url: str | None = None) -> str:
    if not database_url:
        return "unknown"

    try:
        url = make_url(database_url)
        return url.render_as_string(hide_password=True)
    except Exception:
        return "unknown"


def get_database_dsn_info() -> dict[str, Any]:
    try:
        url = make_url(settings.DATABASE_URL)
        return {
            "database": url.get_backend_name() or "unknown",
            "host": url.host,
            "port": url.port,
            "databaseName": url.database,
            "dsn": url.render_as_string(hide_password=True),
        }
    except Exception:
        return {
            "database": "unknown",
            "dsn": "unknown",
        }


def get_database_health() -> dict[str, Any]:
    started = time.perf_counter()
    database = _database_dialect()

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": database,
            "latencyMs": round((time.perf_counter() - started) * 1000, 2),
        }
    except SQLAlchemyError:
        return {
            "status": "unavailable",
            "database": database,
            "error": "Database connection failed",
        }
    except Exception:
        return {
            "status": "unavailable",
            "database": database,
            "error": "Database connection failed",
        }


def check_database_connection() -> bool:
    return get_database_health().get("status") == "ok"
