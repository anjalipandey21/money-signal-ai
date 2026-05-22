from fastapi import APIRouter
from pydantic import BaseModel
from typing import List


router = APIRouter()


class StockSignal(BaseModel):
    ticker: str
    company_name: str
    sector: str
    money_signal_score: int
    signal_type: str
    signal_strength: str
    explanation: str


@router.get("/dashboard/signals", response_model=List[StockSignal])
def get_dashboard_signals():
    """
    Temporary backend-seeded data.

    Later this will come from PostgreSQL.
    For now, the frontend should not hardcode stock signal data.
    """
    return [
        {
            "ticker": "NVDA",
            "company_name": "Nvidia",
            "sector": "Semiconductors",
            "money_signal_score": 88,
            "signal_type": "Institutional Accumulation",
            "signal_strength": "High",
            "explanation": "Multiple funds increased exposure this quarter with no major insider selling pressure.",
        },
        {
            "ticker": "GOOGL",
            "company_name": "Alphabet",
            "sector": "Technology",
            "money_signal_score": 84,
            "signal_type": "High-Conviction Fund Buy",
            "signal_strength": "High",
            "explanation": "Large institutional managers opened or increased positions, suggesting stronger fund interest.",
        },
        {
            "ticker": "MSFT",
            "company_name": "Microsoft",
            "sector": "Cloud / AI",
            "money_signal_score": 81,
            "signal_type": "Insider Confidence",
            "signal_strength": "Medium",
            "explanation": "Recent insider activity is neutral-to-positive while institutional ownership remains strong.",
        },
        {
            "ticker": "TSLA",
            "company_name": "Tesla",
            "sector": "Automotive / Energy",
            "money_signal_score": 69,
            "signal_type": "Mixed Smart-Money Signal",
            "signal_strength": "Medium",
            "explanation": "Institutional activity is mixed, with some funds reducing exposure while others maintain positions.",
        },
        {
            "ticker": "AAPL",
            "company_name": "Apple",
            "sector": "Consumer Technology",
            "money_signal_score": 76,
            "signal_type": "Stable Institutional Holding",
            "signal_strength": "Medium",
            "explanation": "Large funds continue to hold Apple as a core position with limited recent insider pressure.",
        },
    ]