from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
import yfinance as yf

from app.db.database import get_db
from app.models import (
    AIInsight,
    Company,
    Fund,
    FundHolding,
    FundFiling,
    Insider,
    InsiderTrade,
    MoneySignalScore,
    Signal,
)
from app.services.market_data_service import (
    format_market_snapshot,
    get_or_refresh_market_snapshot,
    MarketDataError,
    get_price_history,
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

def _get_stock_profile_from_yfinance(symbol: str) -> dict:
    ticker = yf.Ticker(symbol)

    try:
        info = ticker.get_info()
    except Exception:
        info = {}

    name = (
        info.get("longName")
        or info.get("shortName")
        or info.get("displayName")
        or symbol
    )

    sector = info.get("sector") or "Unknown"
    industry = info.get("industry") or "Unknown"

    return {
        "ticker": symbol,
        "name": name,
        "sector": sector,
        "industry": industry,
    }

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
        snapshot = get_or_refresh_market_snapshot(db, company)
        market = format_market_snapshot(snapshot)

        result.append(
            {
                "ticker": company.ticker,
                "companyName": company.name,
                "category": f"{company.sector or 'Unknown'} / {company.industry or 'Unknown'}",
                "price": market["price"],
                "changeAmount": market["changeAmount"],
                "changePercent": market["changePercent"],
                "marketProvider": market["marketProvider"],
                "priceFetchedAt": market["priceFetchedAt"],
                "marketTime": market["marketTime"],
                "moneySignalScore": float(score.score) if score else 0,
                "scoreLabel": score.score_label if score else "Monitoring",
            }
        )

    return result

@router.get("/quote/{ticker}")
def get_stock_quote(
    ticker: str,
    refresh: bool = Query(False, description="Force refresh from live provider"),
    db: Session = Depends(get_db),
):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    try:
        snapshot = get_or_refresh_market_snapshot(
            db,
            company,
            force_refresh=refresh,
        )
    except MarketDataError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    market = format_market_snapshot(snapshot)

    return {
        "ticker": company.ticker,
        "companyName": company.name,
        "category": f"{company.sector or 'Unknown'} / {company.industry or 'Unknown'}",
        "price": market["price"],
        "changeAmount": market["changeAmount"],
        "changePercent": market["changePercent"],
        "marketProvider": market["marketProvider"],
        "priceFetchedAt": market["priceFetchedAt"],
        "marketTime": market["marketTime"],
    }

@router.get("/quotes")
def get_stock_quotes(
    tickers: str = Query(..., description="Comma-separated tickers like AAPL,NVDA,MSFT"),
    refresh: bool = Query(False, description="Force refresh from live provider"),
    db: Session = Depends(get_db),
):
    symbols = [
        ticker.strip().upper()
        for ticker in tickers.split(",")
        if ticker.strip()
    ]

    if not symbols:
        raise HTTPException(status_code=400, detail="At least one ticker is required")

    if len(symbols) > 25:
        raise HTTPException(
            status_code=400,
            detail="Maximum 25 tickers allowed per request",
        )

    companies = (
        db.query(Company)
        .filter(Company.ticker.in_(symbols))
        .all()
    )

    company_by_ticker = {company.ticker: company for company in companies}

    results = []

    for symbol in symbols:
        company = company_by_ticker.get(symbol)

        if not company:
            results.append(
                {
                    "ticker": symbol,
                    "error": f"{symbol} is not currently tracked",
                }
            )
            continue

        try:
            snapshot = get_or_refresh_market_snapshot(
                db,
                company,
                force_refresh=refresh,
            )
            market = format_market_snapshot(snapshot)

            results.append(
                {
                    "ticker": company.ticker,
                    "companyName": company.name,
                    "category": f"{company.sector or 'Unknown'} / {company.industry or 'Unknown'}",
                    "price": market["price"],
                    "changeAmount": market["changeAmount"],
                    "changePercent": market["changePercent"],
                    "marketProvider": market["marketProvider"],
                    "priceFetchedAt": market["priceFetchedAt"],
                    "marketTime": market["marketTime"],
                }
            )

        except MarketDataError as error:
            results.append(
                {
                    "ticker": symbol,
                    "companyName": company.name,
                    "error": str(error),
                }
            )

    return results
    
@router.get("/history/{ticker}")
def get_stock_price_history(
    ticker: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    history = get_price_history(symbol, days=days)

    return {
        "ticker": symbol,
        "days": days,
        "data": history,
    }

@router.get("/overview")
def get_market_overview(
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Company, MoneySignalScore)
        .outerjoin(MoneySignalScore, MoneySignalScore.company_id == Company.id)
        .order_by(MoneySignalScore.score.desc().nullslast(), Company.ticker.asc())
        .limit(limit)
        .all()
    )

    overview = []

    for company, score in rows:
        try:
            snapshot = get_or_refresh_market_snapshot(db, company)
            market = format_market_snapshot(snapshot)
        except MarketDataError:
            market = {
                "price": None,
                "changeAmount": None,
                "changePercent": None,
                "marketProvider": None,
                "priceFetchedAt": None,
                "marketTime": None,
            }

        latest_insider = (
            db.query(InsiderTrade, Insider)
            .join(Insider, InsiderTrade.insider_id == Insider.id)
            .filter(InsiderTrade.company_id == company.id)
            .order_by(InsiderTrade.transaction_date.desc())
            .first()
        )

        latest_fund = (
            db.query(FundHolding, Fund, FundFiling)
            .join(Fund, FundHolding.fund_id == Fund.id)
            .join(FundFiling, FundHolding.filing_id == FundFiling.id)
            .filter(FundHolding.company_id == company.id)
            .order_by(FundFiling.period_end_date.desc().nullslast())
            .first()
        )

        latest_signal = (
            db.query(Signal)
            .filter(Signal.company_id == company.id)
            .order_by(Signal.detected_at.desc())
            .first()
        )

        insider_count = (
            db.query(InsiderTrade)
            .filter(InsiderTrade.company_id == company.id)
            .count()
        )

        fund_count = (
            db.query(FundHolding)
            .filter(FundHolding.company_id == company.id)
            .count()
        )

        latest_insider_payload = None

        if latest_insider:
            trade, insider = latest_insider

            latest_insider_payload = {
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
                "transactionDate": (
                    trade.transaction_date.isoformat()
                    if trade.transaction_date
                    else None
                ),
            }

        latest_fund_payload = None

        if latest_fund:
            holding, fund, filing = latest_fund

            latest_fund_payload = {
                "institution": fund.name,
                "action": _fund_movement_action(holding.position_status),
                "sharesChange": _format_shares(holding.share_change),
                "tone": _fund_movement_tone(holding.position_status),
                "quarter": holding.quarter,
                "marketValue": format_currency(holding.market_value),
                "periodEndDate": (
                    filing.period_end_date.isoformat()
                    if filing.period_end_date
                    else None
                ),
            }

        latest_signal_payload = None

        if latest_signal:
            detected_at = latest_signal.detected_at or latest_signal.created_at

            latest_signal_payload = {
                "label": latest_signal.signal_type,
                "description": latest_signal.explanation or latest_signal.title,
                "tone": _timeline_tone(latest_signal.direction),
                "sourceType": latest_signal.source_type,
                "sourceName": latest_signal.source_name,
                "detectedAt": detected_at.isoformat() if detected_at else None,
            }

        overview.append(
            {
                "ticker": company.ticker,
                "companyName": company.name,
                "category": f"{company.sector or 'Unknown'} / {company.industry or 'Unknown'}",
                "price": market["price"],
                "changeAmount": market["changeAmount"],
                "changePercent": market["changePercent"],
                "marketProvider": market["marketProvider"],
                "priceFetchedAt": market["priceFetchedAt"],
                "marketTime": market["marketTime"],
                "moneySignalScore": float(score.score) if score else 0,
                "scoreLabel": score.score_label if score else "Monitoring",
                "smartMoneyActivityCount": insider_count + fund_count,
                "insiderActivityCount": insider_count,
                "fundActivityCount": fund_count,
                "latestInsiderActivity": latest_insider_payload,
                "latestFundActivity": latest_fund_payload,
                "latestSignal": latest_signal_payload,
            }
        )

    return {
        "count": len(overview),
        "data": overview,
    }

@router.post("/track/{ticker}")
def track_stock(
    ticker: str,
    db: Session = Depends(get_db),
):
    symbol = ticker.strip().upper()

    existing_company = (
        db.query(Company)
        .filter(Company.ticker == symbol)
        .first()
    )

    if existing_company:
        snapshot = get_or_refresh_market_snapshot(
            db,
            existing_company,
            force_refresh=True,
        )
        market = format_market_snapshot(snapshot)

        return {
            "status": "already_tracked",
            "ticker": existing_company.ticker,
            "companyName": existing_company.name,
            "price": market["price"],
            "changeAmount": market["changeAmount"],
            "changePercent": market["changePercent"],
            "marketProvider": market["marketProvider"],
            "priceFetchedAt": market["priceFetchedAt"],
        }

    profile = _get_stock_profile_from_yfinance(symbol)

    company = Company(
        ticker=profile["ticker"],
        name=profile["name"],
        sector=profile["sector"],
        industry=profile["industry"],
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    snapshot = get_or_refresh_market_snapshot(
        db,
        company,
        force_refresh=True,
    )
    market = format_market_snapshot(snapshot)

    return {
        "status": "tracked",
        "ticker": company.ticker,
        "companyName": company.name,
        "category": f"{company.sector or 'Unknown'} / {company.industry or 'Unknown'}",
        "price": market["price"],
        "changeAmount": market["changeAmount"],
        "changePercent": market["changePercent"],
        "marketProvider": market["marketProvider"],
        "priceFetchedAt": market["priceFetchedAt"],
    }

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

    insider_rows = (
        db.query(InsiderTrade, Insider)
        .join(Insider, InsiderTrade.insider_id == Insider.id)
        .filter(InsiderTrade.company_id == company.id)
        .order_by(InsiderTrade.transaction_date.desc())
        .limit(5)
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

    fund_movement = _build_fund_movement(db, company.id)
    timeline = _build_signal_timeline(db, company.id)

    snapshot = get_or_refresh_market_snapshot(db, company)
    market = format_market_snapshot(snapshot)

    return {
        "ticker": company.ticker,
        "companyName": company.name,
        "category": f"{company.sector or 'Unknown'} / {company.industry or 'Unknown'}",
        "price": market["price"],
        "changeAmount": market["changeAmount"],
        "changePercent": market["changePercent"],
        "marketProvider": market["marketProvider"],
        "priceFetchedAt": market["priceFetchedAt"],
        "marketTime": market["marketTime"],
        "moneySignalScore": float(score.score) if score else 0,
        "scoreLabel": score.score_label if score else "Monitoring",
        "executiveSummary": insight.summary
        if insight
        else f"{company.ticker} is being monitored for smart-money activity.",
        "whyItMatters": (
            f"Recent SEC Form 4 filings produced {len(insider_trades)} insider trade records. "
            f"13F filings produced {len(fund_movement)} institutional holding updates. "
            f"The signal timeline combines both insider and institutional activity to show "
            f"how smart-money behavior is evolving around {company.ticker}."
            ),         
        "insight": insight.insight
        if insight
        else "MoneySignal AI tracks this company across fund holdings, insider trades, and other public disclosure signals.",
        "watchNext": [
                "Next SEC Form 4 filing",
                "Upcoming 13F filing window",
                "Live market data refresh",
            ],
        "riskNote": insight.limitations
        if insight
        else "This is a research signal, not financial advice.",
        "factorBreakdown": factor_breakdown,
        "fundMovement": fund_movement,
        "insiderTrades": insider_trades,
        "timeline": timeline,
    }

def _format_shares(value) -> str:
    if value is None:
        return "0"

    amount = float(value)

    if abs(amount) >= 1_000_000:
        return f"{amount / 1_000_000:+.1f}M"

    if abs(amount) >= 1_000:
        return f"{amount / 1_000:+.1f}K"

    return f"{amount:+,.0f}"


def _fund_movement_tone(position_status: str | None) -> str:
    if position_status in {"NEW", "INCREASED"}:
        return "positive"

    if position_status == "REDUCED":
        return "negative"

    return "neutral"


def _fund_movement_action(position_status: str | None) -> str:
    if position_status == "NEW":
        return "New"

    if position_status == "INCREASED":
        return "Add"

    if position_status == "REDUCED":
        return "Reduce"

    return "Hold"


def _build_fund_movement(db: Session, company_id: int) -> list[dict]:
    rows = (
        db.query(FundHolding, Fund, FundFiling)
        .join(Fund, FundHolding.fund_id == Fund.id)
        .join(FundFiling, FundHolding.filing_id == FundFiling.id)
        .filter(FundHolding.company_id == company_id)
        .order_by(FundFiling.period_end_date.desc().nullslast())
        .limit(10)
        .all()
    )

    movements = []

    for holding, fund, filing in rows:
        movements.append(
            {
                "institution": fund.name,
                "action": _fund_movement_action(holding.position_status),
                "sharesChange": _format_shares(holding.share_change),
                "tone": _fund_movement_tone(holding.position_status),
                "quarter": holding.quarter,
                "shares": float(holding.shares or 0),
                "marketValue": format_currency(holding.market_value),
                "portfolioWeight": (
                    f"{float(holding.portfolio_weight):.2f}%"
                    if holding.portfolio_weight is not None
                    else None
                ),
                "changePercent": (
                    f"{float(holding.change_percent):+.2f}%"
                    if holding.change_percent is not None
                    else None
                ),
                "filingDate": (
                    filing.filing_date.isoformat()
                    if filing.filing_date
                    else None
                ),
                "periodEndDate": (
                    filing.period_end_date.isoformat()
                    if filing.period_end_date
                    else None
                ),
                "filingUrl": filing.filing_url,
            }
        )

    return movements

def _timeline_tone(direction: str | None) -> str:
    if direction == "bullish":
        return "positive"

    if direction == "bearish":
        return "negative"

    return "neutral"


def _timeline_label(signal_type: str | None, source_type: str | None) -> str:
    if signal_type:
        return signal_type

    if source_type == "INSIDER_TRADE":
        return "Insider Activity"

    if source_type == "FUND_HOLDING":
        return "Institutional Activity"

    return "Signal"


def _source_display_name(source_type: str | None) -> str:
    if source_type == "INSIDER_TRADE":
        return "SEC Form 4"

    if source_type == "FUND_HOLDING":
        return "13F Filing"

    return source_type or "Signal Source"


def _format_relative_time(value) -> str:
    if value is None:
        return "Recently"

    now = datetime.utcnow()

    delta = now - value
    seconds = int(delta.total_seconds())

    if seconds < 60:
        return "Just now"

    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m ago"

    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"

    days = hours // 24
    if days < 30:
        return f"{days}d ago"

    months = days // 30
    if months < 12:
        return f"{months}mo ago"

    years = months // 12
    return f"{years}y ago"

def _build_signal_timeline(db: Session, company_id: int) -> list[dict]:
    signals = (
        db.query(Signal)
        .filter(
            Signal.company_id == company_id,
            Signal.source_type.in_(["INSIDER_TRADE", "FUND_HOLDING"]),
        )
        .order_by(Signal.detected_at.desc())
        .limit(12)
        .all()
    )

    timeline = []

    for signal in signals:
        detected_at = signal.detected_at or signal.created_at

        source_label = _source_display_name(signal.source_type)
        source_name = signal.source_name or source_label

        description = signal.explanation or signal.title or "Signal detected."

        timeline.append(
            {
                "label": _timeline_label(signal.signal_type, signal.source_type),
                "time": _format_relative_time(detected_at),
                "description": description,
                "tone": _timeline_tone(signal.direction),

                # Extra fields for future UI improvements
                "sourceType": signal.source_type,
                "sourceName": source_name,
                "sourceLabel": source_label,
                "direction": signal.direction,
                "confidence": float(signal.confidence or 0),
                "strength": float(signal.strength or 0),
                "scoreImpact": float(signal.score_impact or 0),
                "detectedAt": detected_at.isoformat() if detected_at else None,
            }
        )

    return timeline
