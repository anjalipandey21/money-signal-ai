from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import AIInsight, Company
from app.services.ai_explanation_service import (
    generate_ai_insight_by_ticker,
    generate_ai_insights_for_all_companies,
)

router = APIRouter(prefix="/ai-insights", tags=["AI Insights"])


@router.post("/generate")
def generate_all_ai_insights(db: Session = Depends(get_db)):
    results = generate_ai_insights_for_all_companies(db)

    return {
        "message": "AI insights generated successfully",
        "count": len(results),
        "results": results,
    }


@router.post("/generate/{ticker}")
def generate_single_ai_insight(ticker: str, db: Session = Depends(get_db)):
    result = generate_ai_insight_by_ticker(db, ticker)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"{ticker.upper()} is not currently tracked",
        )

    return result


@router.get("/{ticker}")
def get_ai_insight_by_ticker(ticker: str, db: Session = Depends(get_db)):
    company = (
        db.query(Company)
        .filter(Company.ticker == ticker.upper())
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{ticker.upper()} is not currently tracked",
        )

    insight = (
        db.query(AIInsight)
        .filter(AIInsight.company_id == company.id)
        .order_by(AIInsight.created_at.desc())
        .first()
    )

    if not insight:
        raise HTTPException(
            status_code=404,
            detail=f"No AI insight found for {ticker.upper()}",
        )

    return {
        "ticker": company.ticker,
        "companyName": company.name,
        "summary": insight.summary,
        "whyItMatters": insight.why_it_matters,
        "watchNext": insight.watch_next,
        "limitations": insight.limitations,
        "modelName": insight.model_name,
        "createdAt": insight.created_at.isoformat() if insight.created_at else None,
    }