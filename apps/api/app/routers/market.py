from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Company
from app.services.market_data_service import (
    MarketDataError,
    format_market_snapshot,
    get_latest_market_snapshot,
    refresh_market_snapshot,
)

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/snapshot/{ticker}")
def get_market_snapshot(ticker: str, db: Session = Depends(get_db)):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    snapshot = get_latest_market_snapshot(db, company.id)

    return {
        "ticker": company.ticker,
        **format_market_snapshot(snapshot),
    }


@router.post("/refresh/{ticker}")
def refresh_market_data(ticker: str, db: Session = Depends(get_db)):
    try:
        snapshot = refresh_market_snapshot(db, ticker)

        return {
            "ticker": snapshot.symbol,
            **format_market_snapshot(snapshot),
        }

    except MarketDataError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error