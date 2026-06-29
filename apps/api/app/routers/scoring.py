from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models import User
from app.services.scoring_service import (
    recalculate_all_scores,
    recalculate_score_by_ticker,
)

router = APIRouter(prefix="/scoring", tags=["Scoring"])


@router.post("/recalculate")
def recalculate_scores(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_admin_user),
):
    results = recalculate_all_scores(db)

    return {
        "message": "MoneySignal scores recalculated successfully",
        "count": len(results),
        "results": results,
    }


@router.post("/recalculate/{ticker}")
def recalculate_single_score(
    ticker: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_admin_user),
):
    result = recalculate_score_by_ticker(db, ticker)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"{ticker.upper()} is not currently tracked",
        )

    return result
