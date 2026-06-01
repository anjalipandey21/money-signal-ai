from datetime import datetime
from urllib.parse import urlencode
from urllib.request import urlopen
import json

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Company, MarketSnapshot


ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"


class MarketDataError(Exception):
    pass


def _to_float(value):
    if value is None:
        return None

    try:
        return float(str(value).replace("%", "").strip())
    except ValueError:
        return None


def _fetch_alpha_vantage_global_quote(ticker: str) -> dict:
    if not settings.ALPHA_VANTAGE_API_KEY:
        raise MarketDataError("ALPHA_VANTAGE_API_KEY is missing in apps/api/.env")

    query = urlencode(
        {
            "function": "GLOBAL_QUOTE",
            "symbol": ticker,
            "apikey": settings.ALPHA_VANTAGE_API_KEY,
        }
    )

    url = f"{ALPHA_VANTAGE_BASE_URL}?{query}"

    with urlopen(url, timeout=20) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if "Note" in payload:
        raise MarketDataError(payload["Note"])

    if "Information" in payload:
        raise MarketDataError(payload["Information"])

    quote = payload.get("Global Quote")

    if not quote:
        raise MarketDataError(f"No quote returned for {ticker}")

    return quote


def refresh_market_snapshot(db: Session, ticker: str) -> MarketSnapshot:
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise MarketDataError(f"{symbol} is not currently tracked")

    quote = _fetch_alpha_vantage_global_quote(symbol)

    price = _to_float(quote.get("05. price"))
    change_amount = _to_float(quote.get("09. change"))
    change_percent = _to_float(quote.get("10. change percent"))

    latest_trading_day = quote.get("07. latest trading day")
    market_time = None

    if latest_trading_day:
        try:
            market_time = datetime.fromisoformat(latest_trading_day)
        except ValueError:
            market_time = None

    snapshot = MarketSnapshot(
        company_id=company.id,
        symbol=symbol,
        price=price,
        change_amount=change_amount,
        change_percent=change_percent,
        currency="USD",
        provider="alpha_vantage",
        market_time=market_time,
        fetched_at=datetime.utcnow(),
    )

    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return snapshot


def get_latest_market_snapshot(db: Session, company_id: int):
    return (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.company_id == company_id)
        .order_by(MarketSnapshot.fetched_at.desc())
        .first()
    )


def format_market_snapshot(snapshot: MarketSnapshot | None):
    if not snapshot or snapshot.price is None:
        return {
            "price": "$--",
            "changeAmount": "0.00",
            "changePercent": "0.00%",
            "marketProvider": None,
            "priceFetchedAt": None,
            "marketTime": None,
        }

    change_amount = snapshot.change_amount or 0
    change_percent = snapshot.change_percent or 0

    return {
        "price": f"${snapshot.price:,.2f}",
        "changeAmount": f"{change_amount:+.2f}",
        "changePercent": f"{change_percent:+.2f}%",
        "marketProvider": snapshot.provider,
        "priceFetchedAt": snapshot.fetched_at.isoformat()
        if snapshot.fetched_at
        else None,
        "marketTime": snapshot.market_time.isoformat()
        if snapshot.market_time
        else None,
    }