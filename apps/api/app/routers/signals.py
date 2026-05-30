from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/signals", tags=["Signals"])


@router.get("")
def get_signals():
    return [
        {
            "id": "sig-001",
            "ticker": "PLTR",
            "signalEvent": "INSIDER BUY",
            "score": 99,
            "confidence": 88,
            "source": "Form 4",
            "aiContext": "CEO Alex Karp exercised options and held 2.4M shares. First non-sale transaction in 18 months.",
            "time": "2m ago",
            "direction": "bullish",
        },
        {
            "id": "sig-002",
            "ticker": "NVDA",
            "signalEvent": "MULTI-FUND BUYING",
            "score": 82,
            "confidence": 92,
            "source": "Options OPRA",
            "aiContext": "$4.2M premium paid for deep OTM calls expiring next week. Unusual vol/OI ratio detected across multiple strikes.",
            "time": "15m ago",
            "direction": "mixed",
        },
        {
            "id": "sig-003",
            "ticker": "TSLA",
            "signalEvent": "POSITION TRIMMED",
            "score": 65,
            "confidence": 75,
            "source": "FINRA ADF",
            "aiContext": "Large block accumulation detected at VWAP. Neutral overall impact, likely institutional rebalancing.",
            "time": "1h ago",
            "direction": "neutral",
        },
        {
            "id": "sig-004",
            "ticker": "SNOW",
            "signalEvent": "CONFLICTING SIGNAL",
            "score": 21,
            "confidence": 81,
            "source": "Social / 13F",
            "aiContext": "Retail sentiment extremely high while institutional outflows increase significantly quarter-over-quarter.",
            "time": "3h ago",
            "direction": "bearish",
        },
        {
            "id": "sig-005",
            "ticker": "CRWD",
            "signalEvent": "INSTITUTIONAL ACCUMULATION",
            "score": 88,
            "confidence": 95,
            "source": "SEC 13F-HR",
            "aiContext": "Multiple 13F filings show new significant positions from top-tier funds including Renaissance and Two Sigma.",
            "time": "5h ago",
            "direction": "bullish",
        },
    ]