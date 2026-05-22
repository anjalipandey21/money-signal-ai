from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "MoneySignal AI API",
        "version": "0.1.0"
    }