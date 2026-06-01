from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Company, MoneySignalScore, Signal, Watchlist
from app.services.market_data_service import (
    format_market_snapshot,
    get_latest_market_snapshot,
)

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

DEMO_USER_ID = "demo-user"


def score_to_trend(score: float):
    if score >= 75:
        return "positive"

    if score >= 60:
        return "neutral"

    return "negative"


@router.get("")
@router.get("/")
def get_watchlist(db: Session = Depends(get_db)):
    rows = (
        db.query(Watchlist, Company, MoneySignalScore)
        .join(Company, Watchlist.company_id == Company.id)
        .outerjoin(MoneySignalScore, MoneySignalScore.company_id == Company.id)
        .filter(Watchlist.user_id == DEMO_USER_ID)
        .order_by(MoneySignalScore.score.desc().nullslast())
        .all()
    )

    result = []

    for watchlist_item, company, score in rows:
        latest_signal = (
            db.query(Signal)
            .filter(Signal.company_id == company.id)
            .order_by(Signal.detected_at.desc())
            .first()
        )

        score_value = float(score.score) if score else 0
        snapshot = get_latest_market_snapshot(db, company.id)
        market = format_market_snapshot(snapshot)

        result.append(
            {
                "id": watchlist_item.id,
                "ticker": company.ticker,
                "companyName": company.name,
                "sector": company.sector,
                "industry": company.industry,
                "price": market["price"],
                "change": market["changePercent"],
                "changeAmount": market["changeAmount"],
                "changePercent": market["changePercent"],
                "moneySignalScore": score_value,
                "scoreLabel": score.score_label if score else "Monitoring",
                "trend": score_to_trend(score_value),
                "latestSignal": latest_signal.title if latest_signal else "No recent signal",
                "latestSignalType": latest_signal.signal_type if latest_signal else None,
                "latestSignalDirection": latest_signal.direction if latest_signal else "neutral",
                "createdAt": watchlist_item.created_at.isoformat()
                if watchlist_item.created_at
                else None,
            }
        )

    return result


@router.post("/{ticker}")
def add_to_watchlist(ticker: str, db: Session = Depends(get_db)):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    existing = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == DEMO_USER_ID,
            Watchlist.company_id == company.id,
        )
        .first()
    )

    if existing:
        return {
            "message": f"{symbol} is already in watchlist",
            "ticker": company.ticker,
            "watchlistId": existing.id,
        }

    watchlist_item = Watchlist(
        user_id=DEMO_USER_ID,
        company_id=company.id,
    )

    db.add(watchlist_item)
    db.commit()
    db.refresh(watchlist_item)

    return {
        "message": f"{symbol} added to watchlist",
        "ticker": company.ticker,
        "watchlistId": watchlist_item.id,
    }


@router.delete("/{ticker}")
def remove_from_watchlist(ticker: str, db: Session = Depends(get_db)):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    watchlist_item = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == DEMO_USER_ID,
            Watchlist.company_id == company.id,
        )
        .first()
    )

    if not watchlist_item:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not in watchlist",
        )

    db.delete(watchlist_item)
    db.commit()

    return {
        "message": f"{symbol} removed from watchlist",
        "ticker": company.ticker,
    }