from fastapi import FastAPI
from app.routers.health import router as health_router

app = FastAPI(
    title="MoneySignal AI API",
    description="Backend API for smart-money signal intelligence.",
    version="0.1.0",
)

app.include_router(health_router, prefix="/api")