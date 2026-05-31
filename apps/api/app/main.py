from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.routers.dashboard import router as dashboard_router
from app.routers.health import router as health_router
from app.routers import dashboard, signals
from app.routers.signals import router as signals_router
from app.routers.stocks import router as stocks_router
from app.routers.watchlist import router as watchlist_router
from app.routers.alerts import router as alerts_router

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
                        )

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MoneySignal AI API",
    description="Backend API for smart-money signal intelligence.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(signals.router, prefix="/api")
app.include_router(stocks_router, prefix="/api")
app.include_router(watchlist_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")