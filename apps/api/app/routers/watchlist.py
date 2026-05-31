from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/watchlist", tags=["Watchlist"])


class WatchlistCreateRequest(BaseModel):
    ticker: str


WATCHLIST_ITEMS = [
    {
        "ticker": "NVDA",
        "companyName": "NVIDIA Corporation",
        "sector": "Semiconductors",
        "price": "$128.61",
        "change": "+4.1%",
        "score": 92,
        "signal": "Institutional Accumulation",
        "direction": "bullish",
        "alertStatus": "Active",
        "lastUpdated": "Today, 09:42 EST",
    },
    {
        "ticker": "PLTR",
        "companyName": "Palantir Technologies",
        "sector": "AI / Data Analytics",
        "price": "$21.84",
        "change": "+2.7%",
        "score": 94,
        "signal": "Insider Buy",
        "direction": "bullish",
        "alertStatus": "Active",
        "lastUpdated": "Today, 09:18 EST",
    },
    {
        "ticker": "TSLA",
        "companyName": "Tesla Inc.",
        "sector": "Automotive / EV",
        "price": "$178.92",
        "change": "-1.2%",
        "score": 65,
        "signal": "Position Trimmed",
        "direction": "neutral",
        "alertStatus": "Watching",
        "lastUpdated": "Today, 08:50 EST",
    },
    {
        "ticker": "AMD",
        "companyName": "Advanced Micro Devices",
        "sector": "Semiconductors",
        "price": "$164.30",
        "change": "+1.8%",
        "score": 81,
        "signal": "Options Activity",
        "direction": "mixed",
        "alertStatus": "Active",
        "lastUpdated": "Yesterday, 16:12 EST",
    },
]


STOCK_DIRECTORY = {
    "AAPL": {
        "companyName": "Apple Inc.",
        "sector": "Consumer Technology",
        "price": "$189.43",
        "change": "+0.9%",
        "score": 78,
        "signal": "Steady Accumulation",
        "direction": "mixed",
    },
    "MSFT": {
        "companyName": "Microsoft Corporation",
        "sector": "Cloud / AI",
        "price": "$421.12",
        "change": "+1.4%",
        "score": 86,
        "signal": "Fund Buying",
        "direction": "bullish",
    },
    "GOOGL": {
        "companyName": "Alphabet Inc.",
        "sector": "Internet / Advertising",
        "price": "$174.55",
        "change": "+0.6%",
        "score": 83,
        "signal": "Institutional Interest",
        "direction": "bullish",
    },
    "META": {
        "companyName": "Meta Platforms",
        "sector": "Social / AI",
        "price": "$502.18",
        "change": "+2.1%",
        "score": 89,
        "signal": "AI Momentum",
        "direction": "bullish",
    },
    "AMZN": {
        "companyName": "Amazon.com Inc.",
        "sector": "E-commerce / Cloud",
        "price": "$184.75",
        "change": "+1.1%",
        "score": 84,
        "signal": "Cloud Strength",
        "direction": "bullish",
    },
}


@router.get("")
def get_watchlist():
    return WATCHLIST_ITEMS


@router.post("")
def add_watchlist_item(request: WatchlistCreateRequest):
    ticker = request.ticker.strip().upper()

    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")

    already_exists = any(item["ticker"] == ticker for item in WATCHLIST_ITEMS)

    if already_exists:
        raise HTTPException(
            status_code=409,
            detail=f"{ticker} is already in your watchlist",
        )

    stock_data = STOCK_DIRECTORY.get(
        ticker,
        {
            "companyName": f"{ticker} Corporation",
            "sector": "Unknown",
            "price": "$--",
            "change": "0.0%",
            "score": 70,
            "signal": "Monitoring Started",
            "direction": "neutral",
        },
    )

    new_item = {
        "ticker": ticker,
        "companyName": stock_data["companyName"],
        "sector": stock_data["sector"],
        "price": stock_data["price"],
        "change": stock_data["change"],
        "score": stock_data["score"],
        "signal": stock_data["signal"],
        "direction": stock_data["direction"],
        "alertStatus": "Active",
        "lastUpdated": "Just now",
    }

    WATCHLIST_ITEMS.insert(0, new_item)

    return new_item

@router.delete("/{ticker}")
def remove_watchlist_item(ticker: str):
    symbol = ticker.strip().upper()

    for index, item in enumerate(WATCHLIST_ITEMS):
        if item["ticker"] == symbol:
            removed_item = WATCHLIST_ITEMS.pop(index)
            return {
                "message": f"{symbol} removed from watchlist",
                "removed": removed_item,
            }

    raise HTTPException(
        status_code=404,
        detail=f"{symbol} is not in your watchlist",
    )