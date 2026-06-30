from fastapi import APIRouter

from app.core.cache import cache
from app.db.manager import get_database_health

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "MoneySignal AI API",
        "version": "0.1.0"
    }


@router.get("/health/db")
def database_health_check():
    return get_database_health()


@router.get("/health/cache")
def cache_health_check():
    return cache.health()

