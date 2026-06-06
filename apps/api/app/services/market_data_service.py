from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen
import json
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Company, MarketSnapshot


logger = logging.getLogger(__name__)

ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"


class MarketDataError(Exception):
    pass


def _to_float(value: Any):
    if value is None:
        return None

    try:
        return float(str(value).replace("%", "").replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def _to_decimal(value: Any):
    parsed = _to_float(value)

    if parsed is None:
        return None

    return Decimal(str(round(parsed, 4)))


def _provider_order() -> list[str]:
    provider = (settings.MARKET_DATA_PROVIDER or "auto").lower().strip()

    if provider == "auto":
        providers = ["yfinance"]

        if settings.ALPHA_VANTAGE_API_KEY:
            providers.append("alpha_vantage")

        return providers

    if provider in {"yfinance", "alpha_vantage"}:
        return [provider]

    raise MarketDataError(
        "MARKET_DATA_PROVIDER must be one of: auto, yfinance, alpha_vantage"
    )


def _fetch_yfinance_quote(ticker: str) -> dict[str, Any]:
    try:
        import yfinance as yf
    except ImportError as exc:
        raise MarketDataError(
            "yfinance is not installed. Run: pip install -r apps/api/requirements.txt"
        ) from exc

    try:
        stock = yf.Ticker(ticker)
        fast_info = getattr(stock, "fast_info", {}) or {}

        def fast_get(*keys):
            for key in keys:
                try:
                    value = fast_info.get(key)
                except AttributeError:
                    value = getattr(fast_info, key, None)

                if value is not None:
                    return value

            return None

        history = stock.history(
            period="5d",
            interval="1d",
            auto_adjust=False,
        )

        close_values = []
        market_time = None

        if history is not None and not history.empty and "Close" in history:
            close_series = history["Close"].dropna()
            close_values = [float(value) for value in close_series.tolist()]

            last_index = close_series.index[-1] if len(close_series) else None

            if last_index is not None and hasattr(last_index, "to_pydatetime"):
                market_time = last_index.to_pydatetime().replace(tzinfo=None)

        price = _to_float(
            fast_get("lastPrice", "last_price", "regularMarketPrice")
        )

        if price is None and close_values:
            price = close_values[-1]

        previous_close = _to_float(
            fast_get(
                "previousClose",
                "previous_close",
                "regularMarketPreviousClose",
            )
        )

        if previous_close is None and len(close_values) >= 2:
            previous_close = close_values[-2]

        if price is None:
            raise MarketDataError(f"No Yahoo Finance quote returned for {ticker}")

        change_amount = None
        change_percent = None

        if previous_close and previous_close != 0:
            change_amount = price - previous_close
            change_percent = (change_amount / previous_close) * 100

        currency = fast_get("currency") or "USD"

        return {
            "symbol": ticker,
            "price": price,
            "change_amount": change_amount,
            "change_percent": change_percent,
            "currency": currency,
            "provider": "yfinance",
            "market_time": market_time,
            "raw_payload": {
                "last_price": price,
                "previous_close": previous_close,
                "currency": currency,
            },
        }

    except MarketDataError:
        raise

    except Exception as exc:
        raise MarketDataError(
            f"Yahoo Finance fetch failed for {ticker}: {exc}"
        ) from exc


def _fetch_alpha_vantage_global_quote(ticker: str) -> dict[str, Any]:
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

    with urlopen(
        url,
        timeout=settings.MARKET_DATA_REQUEST_TIMEOUT_SECONDS,
    ) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if "Note" in payload:
        raise MarketDataError(payload["Note"])

    if "Information" in payload:
        raise MarketDataError(payload["Information"])

    quote = payload.get("Global Quote")

    if not quote:
        raise MarketDataError(f"No Alpha Vantage quote returned for {ticker}")

    latest_trading_day = quote.get("07. latest trading day")
    market_time = None

    if latest_trading_day:
        try:
            market_time = datetime.fromisoformat(latest_trading_day)
        except ValueError:
            market_time = None

    return {
        "symbol": ticker,
        "price": _to_float(quote.get("05. price")),
        "change_amount": _to_float(quote.get("09. change")),
        "change_percent": _to_float(quote.get("10. change percent")),
        "currency": "USD",
        "provider": "alpha_vantage",
        "market_time": market_time,
        "raw_payload": quote,
    }


def fetch_market_quote(ticker: str) -> dict[str, Any]:
    symbol = ticker.strip().upper()
    errors: list[str] = []

    for provider in _provider_order():
        try:
            if provider == "yfinance":
                return _fetch_yfinance_quote(symbol)

            if provider == "alpha_vantage":
                return _fetch_alpha_vantage_global_quote(symbol)

        except MarketDataError as exc:
            errors.append(f"{provider}: {exc}")
            logger.warning("Market provider failed for %s: %s", symbol, exc)

    raise MarketDataError(
        "; ".join(errors) or f"No market data provider available for {symbol}"
    )


def get_latest_market_snapshot(db: Session, company_id: int):
    return (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.company_id == company_id)
        .order_by(MarketSnapshot.fetched_at.desc())
        .first()
    )


def is_market_snapshot_stale(snapshot: MarketSnapshot | None) -> bool:
    if not snapshot or not snapshot.fetched_at:
        return True

    ttl = timedelta(seconds=settings.MARKET_DATA_CACHE_TTL_SECONDS)

    return datetime.utcnow() - snapshot.fetched_at > ttl


def refresh_market_snapshot(db: Session, ticker: str) -> MarketSnapshot:
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise MarketDataError(f"{symbol} is not currently tracked")

    quote = fetch_market_quote(symbol)

    snapshot = MarketSnapshot(
        company_id=company.id,
        symbol=symbol,
        price=_to_decimal(quote.get("price")),
        change_amount=_to_decimal(quote.get("change_amount")),
        change_percent=_to_decimal(quote.get("change_percent")),
        currency=quote.get("currency") or "USD",
        provider=quote.get("provider") or "unknown",
        market_time=quote.get("market_time"),
        fetched_at=datetime.utcnow(),
        raw_payload=quote.get("raw_payload"),
    )

    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return snapshot


def get_or_refresh_market_snapshot(
    db: Session,
    company: Company,
    force_refresh: bool = False,
):
    snapshot = get_latest_market_snapshot(db, company.id)

    if snapshot and not force_refresh and not is_market_snapshot_stale(snapshot):
        return snapshot

    try:
        return refresh_market_snapshot(db, company.ticker)

    except MarketDataError:
        if snapshot:
            return snapshot

        raise


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

    change_amount = float(snapshot.change_amount or 0)
    change_percent = float(snapshot.change_percent or 0)

    return {
        "price": f"${float(snapshot.price):,.2f}",
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