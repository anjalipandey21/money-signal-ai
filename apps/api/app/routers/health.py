from fastapi import APIRouter

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
