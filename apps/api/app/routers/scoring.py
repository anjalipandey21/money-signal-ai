from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.scoring_service import (
    recalculate_all_scores,
    recalculate_score_by_ticker,
)

router = APIRouter(prefix="/scoring", tags=["Scoring"])


@router.post("/recalculate")
def recalculate_scores(db: Session = Depends(get_db)):
    results = recalculate_all_scores(db)

    return {
        "message": "MoneySignal scores recalculated successfully",
        "count": len(results),
        "results": results,
    }


@router.post("/recalculate/{ticker}")
def recalculate_single_score(ticker: str, db: Session = Depends(get_db)):
    result = recalculate_score_by_ticker(db, ticker)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"{ticker.upper()} is not currently tracked",
        )

    return result