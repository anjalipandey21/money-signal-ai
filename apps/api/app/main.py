import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.manager import get_database_health
from app.routers.dashboard import router as dashboard_router
from app.routers.health import router as health_router
from app.routers.signals import router as signals_router
from app.routers.stocks import router as stocks_router
from app.routers.watchlist import router as watchlist_router
from app.routers.alerts import router as alerts_router
from app.routers.scoring import router as scoring_router
from app.routers.ai_insights import router as ai_insights_router
from app.routers.market import router as market_router
from app.routers.data_health import router as data_health_router
from app.routers.scraper import router as scraper_router
from app.routers.scheduler import router as scheduler_router
from app.routers.auth import router as auth_router
from app.services.scheduler_service import start_scheduler, stop_scheduler

logger = logging.getLogger(__name__)

app = FastAPI(
    title="MoneySignal AI API",
    description="Backend API for smart-money signal intelligence.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_routers = [
    health_router,
    dashboard_router,
    signals_router,
    stocks_router,
    watchlist_router,
    alerts_router,
    scoring_router,
    ai_insights_router,
    market_router,
    data_health_router,
    scraper_router,
    scheduler_router,
    auth_router,
]

for router in api_routers:
    app.include_router(router, prefix=settings.API_V1_PREFIX)

if settings.ENABLE_LEGACY_API_PREFIX:
    # Deprecated compatibility during the /api -> /api/v1 migration.
    for router in api_routers:
        app.include_router(router, prefix=settings.API_PREFIX)


@app.on_event("startup")
def start_background_scheduler():
    database_health = get_database_health()

    if database_health["status"] == "ok":
        logger.info(
            "Database connectivity check passed: database=%s latencyMs=%s",
            database_health.get("database"),
            database_health.get("latencyMs"),
        )
    else:
        logger.warning(
            "Database connectivity check failed: database=%s error=%s",
            database_health.get("database"),
            database_health.get("error"),
        )

        if settings.REQUIRE_DB_ON_STARTUP:
            raise RuntimeError("Database connectivity check failed")

    if settings.CACHE_WARM_ON_STARTUP:
        from app.services.cache_warming_service import warm_public_cache

        warm_public_cache()

    if settings.SCHEDULER_ENABLED:
        start_scheduler()


@app.on_event("shutdown")
def stop_background_scheduler():
    stop_scheduler()

