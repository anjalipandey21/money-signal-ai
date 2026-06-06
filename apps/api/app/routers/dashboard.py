from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import (
    AIInsight,
    Company,
    Fund,
    FundHolding,
    Insider,
    InsiderTrade,
    MoneySignalScore,
    Signal,
    Watchlist,
)
from app.services.market_data_service import (
    format_market_snapshot,
    get_latest_market_snapshot,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def format_currency(value):
    if value is None:
        return "$--"

    value = float(value)

    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.1f}B"

    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"

    return f"${value:,.0f}"


def signal_direction_to_trend(direction: str):
    if direction == "bullish":
        return "positive"

    if direction == "bearish":
        return "negative"

    return "neutral"


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    active_signals = db.query(Signal).count()
    bullish_signals = db.query(Signal).filter(Signal.direction == "bullish").count()
    bearish_signals = db.query(Signal).filter(Signal.direction == "bearish").count()
    watchlist_count = db.query(Watchlist).filter(Watchlist.user_id == "demo-user").count()

    top_score = (
        db.query(MoneySignalScore)
        .order_by(MoneySignalScore.score.desc())
        .first()
    )

    return {
        "moneySignalScore": float(top_score.score) if top_score else 0,
        "activeSignals": active_signals,
        "bullishSignals": bullish_signals,
        "bearishSignals": bearish_signals,
        "watchlistCount": watchlist_count,
    }


@router.get("/top-scores")
def get_top_money_signal_scores(db: Session = Depends(get_db)):
    rows = (
        db.query(MoneySignalScore, Company)
        .join(Company, MoneySignalScore.company_id == Company.id)
        .order_by(MoneySignalScore.score.desc())
        .limit(5)
        .all()
    )

    result = []

    for score, company in rows:
        snapshot = get_latest_market_snapshot(db, company.id)
        market = format_market_snapshot(snapshot)

        result.append(
            {
                "ticker": company.ticker,
                "company": company.name,
                "price": market["price"],
                "change": market["changePercent"],
                "marketProvider": market["marketProvider"],
                "priceFetchedAt": market["priceFetchedAt"],
                "marketTime": market["marketTime"],
                "score": float(score.score),
            }
        )
    return result


@router.get("/institutional-moves")
def get_recent_institutional_moves(db: Session = Depends(get_db)):
    rows = (
        db.query(FundHolding, Fund, Company)
        .join(Fund, FundHolding.fund_id == Fund.id)
        .join(Company, FundHolding.company_id == Company.id)
        .order_by(FundHolding.created_at.desc())
        .limit(5)
        .all()
    )

    return [
        {
            "institution": fund.name,
            "ticker": company.ticker,
            "action": holding.position_status.title() if holding.position_status else "Unknown",
            "value": format_currency(holding.market_value),
            "time": "Latest 13F",
        }
        for holding, fund, company in rows
    ]


@router.get("/insider-trades")
def get_recent_insider_trades(db: Session = Depends(get_db)):
    rows = (
        db.query(InsiderTrade, Insider, Company)
        .join(Insider, InsiderTrade.insider_id == Insider.id)
        .join(Company, InsiderTrade.company_id == Company.id)
        .order_by(InsiderTrade.transaction_date.desc())
        .limit(5)
        .all()
    )

    return [
        {
            "insider": insider.name,
            "ticker": company.ticker,
            "role": insider.title or "Insider",
            "action": trade.transaction_type,
            "value": format_currency(trade.total_value),
            "date": trade.transaction_date.isoformat(),
        }
        for trade, insider, company in rows
    ]


@router.get("/ai-market-pulse")
def get_ai_market_pulse(db: Session = Depends(get_db)):
    top_insight = (
        db.query(AIInsight, Company, MoneySignalScore)
        .join(Company, AIInsight.company_id == Company.id)
        .join(MoneySignalScore, MoneySignalScore.company_id == Company.id)
        .order_by(MoneySignalScore.score.desc())
        .first()
    )

    if not top_insight:
        return {
            "title": "No AI insight available",
            "summary": "Seed the database to generate AI market pulse data.",
            "sentimentLabel": "Market Pulse",
            "sentimentScore": 0,
        }

    insight, company, score = top_insight

    return {
        "title": f"{company.ticker} Smart Money Pulse",
        "summary": insight.summary,
        "sentimentLabel": score.score_label or "Signal Strength",
        "sentimentScore": float(score.score),
    }


@router.get("/watchlist-preview")
def get_watchlist_preview(db: Session = Depends(get_db)):
    rows = (
        db.query(Watchlist, Company, MoneySignalScore)
        .join(Company, Watchlist.company_id == Company.id)
        .join(MoneySignalScore, MoneySignalScore.company_id == Company.id)
        .filter(Watchlist.user_id == "demo-user")
        .order_by(MoneySignalScore.score.desc())
        .limit(4)
        .all()
    )

    result = []

    for watchlist, company, score in rows:
        snapshot = get_latest_market_snapshot(db, company.id)
        market = format_market_snapshot(snapshot)

        change_percent = market["changePercent"]

        result.append(
            {
                "ticker": company.ticker,
                "change": change_percent,
                "trend": "negative"
                if change_percent.startswith("-")
                else "positive"
                if not change_percent.startswith("0")
                else "neutral",
                "marketProvider": market["marketProvider"],
                "priceFetchedAt": market["priceFetchedAt"],
                "marketTime": market["marketTime"],
            }
        )

    return result