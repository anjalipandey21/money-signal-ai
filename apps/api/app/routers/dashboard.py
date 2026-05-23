from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.signal import DashboardSignalResponse
from app.services.signal_service import get_dashboard_signals

router = APIRouter()


@router.get("/dashboard/signals", response_model=List[DashboardSignalResponse])
def dashboard_signals(db: Session = Depends(get_db)):
    return get_dashboard_signals(db)