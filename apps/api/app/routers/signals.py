from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.signal_service import get_signals_by_ticker, get_top_signals

router = APIRouter(prefix="/signals", tags=["Signals"])


@router.get("")
def list_signals(limit: int = 20, db: Session = Depends(get_db)):
    return get_top_signals(db=db, limit=limit)


@router.get("/")
def list_signals_with_slash(limit: int = 20, db: Session = Depends(get_db)):
    return get_top_signals(db=db, limit=limit)


@router.get("/{ticker}")
def list_signals_by_ticker(ticker: str, db: Session = Depends(get_db)):
    return get_signals_by_ticker(db=db, ticker=ticker)