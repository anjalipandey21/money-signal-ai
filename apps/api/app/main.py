from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
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

from app.models import (Company,
                        Insider,
                        InsiderTrade,
                        Fund,
                        FundFiling,
                        FundHolding,
                        ProcessedFiling,
                        Signal,
                        MoneySignalScore,
                        AIInsight,
                        Watchlist,
                        Alert,
                        MarketSnapshot,
                        )

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MoneySignal AI API",
    description="Backend API for smart-money signal intelligence.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(signals_router, prefix="/api")
app.include_router(stocks_router, prefix="/api")
app.include_router(watchlist_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(scoring_router, prefix="/api")
app.include_router(ai_insights_router, prefix="/api")
app.include_router(market_router, prefix="/api")
app.include_router(data_health_router, prefix="/api")