from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.signal import DashboardSignalResponse
from app.services.signal_service import get_dashboard_signals

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary():
    return {
        "moneySignalScore": 67,
        "activeSignals": 24,
        "bullishSignals": 16,
        "bearishSignals": 5,
        "watchlistCount": 8,
    }

@router.get("/top-scores")
def get_top_money_signal_scores():
    return [
        {
            "ticker": "GOOGL",
            "company": "Alphabet Inc.",
            "price": "$174.52",
            "change": "+2.4%",
            "score": 99,
        },
        {
            "ticker": "NVDA",
            "company": "NVIDIA Corp.",
            "price": "$128.61",
            "change": "+4.1%",
            "score": 88,
        },
        {
            "ticker": "MSFT",
            "company": "Microsoft Corp.",
            "price": "$442.10",
            "change": "+0.8%",
            "score": 85,
        },
        {
            "ticker": "META",
            "company": "Meta Platforms",
            "price": "$502.14",
            "change": "+1.9%",
            "score": 82,
        },
    ]

@router.get("/institutional-moves")
def get_recent_institutional_moves():
    return [
        {
            "institution": "BlackRock Inc.",
            "ticker": "TSLA",
            "action": "Accumulate",
            "value": "$0.2B",
            "time": "09:42 EST",
        },
        {
            "institution": "Vanguard Group",
            "ticker": "AAPL",
            "action": "Accumulate",
            "value": "$840M",
            "time": "11:15 EST",
        },
        {
            "institution": "Goldman Sachs",
            "ticker": "NFLX",
            "action": "Trim",
            "value": "$420M",
            "time": "13:22 EST",
        },
        {
            "institution": "JPMorgan Chase",
            "ticker": "AMD",
            "action": "Accumulate",
            "value": "$310M",
            "time": "14:05 EST",
        },
    ]