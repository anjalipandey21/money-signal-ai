import logging

from app.db.database import SessionLocal
from app.routers.dashboard import get_dashboard_summary
from app.routers.data_health import get_market_data_health
from app.routers.stocks import list_stocks

logger = logging.getLogger(__name__)


def warm_public_cache() -> None:
    db = SessionLocal()

    try:
        get_dashboard_summary(db)
        list_stocks(limit=25, offset=0, search=None, refresh=False, db=db)
        get_market_data_health(db)
        logger.info("Public API cache warm-up completed")
    except Exception as error:
        logger.warning("Public API cache warm-up skipped: %s", str(error))
    finally:
        db.close()
