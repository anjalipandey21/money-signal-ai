from fastapi import APIRouter, Depends, HTTPException
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
)
from app.services.market_data_service import (
    format_market_snapshot,
    get_latest_market_snapshot,
)

router = APIRouter(prefix="/stocks", tags=["Stocks"])


def format_currency(value):
    if value is None:
        return "$--"

    value = float(value)

    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.1f}B"

    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"

    return f"${value:,.0f}"


def format_share_change(value):
    if value is None:
        return "0"

    value = float(value)

    if value >= 1_000_000:
        return f"{value / 1_000_000:+.1f}M"

    if value >= 1_000:
        return f"{value / 1_000:+.1f}K"

    return f"{value:+.0f}"


def score_to_tone(score):
    if score >= 80:
        return "positive"

    if score >= 60:
        return "primary"

    return "negative"


def direction_to_tone(direction):
    if direction == "bullish":
        return "positive"

    if direction == "bearish":
        return "negative"

    return "neutral"


def holding_status_to_action(status):
    if not status:
        return "Unknown"

    mapping = {
        "NEW": "New",
        "INCREASED": "Add",
        "REDUCED": "Reduce",
        "EXITED": "Exit",
        "UNCHANGED": "Hold",
    }

    return mapping.get(status.upper(), status.title())


@router.get("")
@router.get("/")
def list_stocks(db: Session = Depends(get_db)):
    rows = (
        db.query(Company, MoneySignalScore)
        .outerjoin(MoneySignalScore, MoneySignalScore.company_id == Company.id)
        .order_by(MoneySignalScore.score.desc().nullslast())
        .all()
    )

    result = []

    for company, score in rows:
        snapshot = get_latest_market_snapshot(db, company.id)
        market = format_market_snapshot(snapshot)

        result.append(
            {
                "ticker": company.ticker,
                "companyName": company.name,
                "category": f"{company.sector or 'Unknown'} / {company.industry or 'Unknown'}",
                "price": market["price"],
                "changeAmount": market["changeAmount"],
                "changePercent": market["changePercent"],
                "moneySignalScore": float(score.score) if score else 0,
                "scoreLabel": score.score_label if score else "Monitoring",
            }
        )

    return result


@router.get("/{ticker}")
def get_stock_detail(ticker: str, db: Session = Depends(get_db)):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    score = (
        db.query(MoneySignalScore)
        .filter(MoneySignalScore.company_id == company.id)
        .order_by(MoneySignalScore.calculated_at.desc())
        .first()
    )

    insight = (
        db.query(AIInsight)
        .filter(AIInsight.company_id == company.id)
        .order_by(AIInsight.created_at.desc())
        .first()
    )

    fund_rows = (
        db.query(FundHolding, Fund)
        .join(Fund, FundHolding.fund_id == Fund.id)
        .filter(FundHolding.company_id == company.id)
        .order_by(FundHolding.created_at.desc())
        .limit(5)
        .all()
    )

    insider_rows = (
        db.query(InsiderTrade, Insider)
        .join(Insider, InsiderTrade.insider_id == Insider.id)
        .filter(InsiderTrade.company_id == company.id)
        .order_by(InsiderTrade.transaction_date.desc())
        .limit(5)
        .all()
    )

    signal_rows = (
        db.query(Signal)
        .filter(Signal.company_id == company.id)
        .order_by(Signal.detected_at.desc())
        .limit(6)
        .all()
    )

    score_value = float(score.score) if score else 0

    factor_breakdown = [
        {
            "label": "Institutional Flow",
            "value": float(score.institutional_score) if score else 0,
            "tone": score_to_tone(float(score.institutional_score)) if score else "neutral",
        },
        {
            "label": "Insider Activity",
            "value": float(score.insider_score) if score else 0,
            "tone": score_to_tone(float(score.insider_score)) if score else "neutral",
        },
        {
            "label": "Signal Freshness",
            "value": float(score.freshness_score) if score else 0,
            "tone": "primary",
        },
        {
            "label": "Confidence",
            "value": float(score.confidence_score) if score else 0,
            "tone": "primary",
        },
        {
            "label": "Political / Activist / Buyback",
            "value": float(
                (score.political_score or 0)
                + (score.activist_score or 0)
                + (score.buyback_score or 0)
            )
            if score
            else 0,
            "tone": "neutral",
        },
    ]

    fund_movement = [
        {
            "institution": fund.name,
            "action": holding_status_to_action(holding.position_status),
            "sharesChange": format_share_change(holding.share_change),
            "tone": (
                "positive"
                if holding.position_status in ["NEW", "INCREASED"]
                else "negative"
                if holding.position_status in ["REDUCED", "EXITED"]
                else "neutral"
            ),
        }
        for holding, fund in fund_rows
    ]

    insider_trades = [
        {
            "insider": insider.name,
            "type": trade.transaction_type,
            "value": format_currency(trade.total_value),
            "tone": (
                "positive"
                if trade.transaction_code == "P"
                else "negative"
                if trade.transaction_code == "S"
                else "neutral"
            ),
        }
        for trade, insider in insider_rows
    ]

    timeline = [
        {
            "label": signal.signal_type,
            "time": signal.detected_at.isoformat() if signal.detected_at else "Recently",
            "description": signal.explanation or signal.title,
            "tone": direction_to_tone(signal.direction),
        }
        for signal in signal_rows
    ]

    snapshot = get_latest_market_snapshot(db, company.id)
    market = format_market_snapshot(snapshot)

    return {
        "ticker": company.ticker,
        "companyName": company.name,
        "category": f"{company.sector or 'Unknown'} / {company.industry or 'Unknown'}",
        "price": market["price"],
        "changeAmount": market["changeAmount"],
        "changePercent": market["changePercent"],
        "moneySignalScore": score_value,
        "scoreLabel": score.score_label if score else "Monitoring",
        "executiveSummary": insight.summary
        if insight
        else f"{company.ticker} is being monitored for smart-money activity.",
        "whyItMatters": insight.why_it_matters
        if insight
        else "MoneySignal AI tracks this company across fund holdings, insider trades, and other public disclosure signals.",
        "watchNext": [
            insight.watch_next if insight else "Watch for the next public disclosure update.",
            "Next 13F filing window",
            "New insider Form 4 filings",
        ],
        "riskNote": insight.limitations
        if insight
        else "This is a research signal, not financial advice.",
        "factorBreakdown": factor_breakdown,
        "fundMovement": fund_movement,
        "insiderTrades": insider_trades,
        "timeline": timeline,
    }