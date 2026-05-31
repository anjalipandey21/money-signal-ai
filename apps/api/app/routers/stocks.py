from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/stocks", tags=["Stocks"])


COMMON_STOCK_DETAIL = {
    "watchNext": [
        "Upcoming earnings call",
        "Next 13F filing window",
    ],
    "riskNote": (
        "Model confidence may change as new public filings, options activity, "
        "and insider transactions are detected."
    ),
    "factorBreakdown": [
        {"label": "Institutional Flow", "value": 88, "tone": "positive"},
        {"label": "Multi-Fund Presence", "value": 84, "tone": "positive"},
        {"label": "Signal Freshness", "value": 80, "tone": "primary"},
        {"label": "Insider Selling", "value": 30, "tone": "negative"},
        {"label": "Confidence", "value": 82, "tone": "primary"},
    ],
    "fundMovement": [
        {
            "institution": "Renaissance Technologies",
            "action": "New",
            "sharesChange": "+1.2M",
            "tone": "positive",
        },
        {
            "institution": "Two Sigma Advisers",
            "action": "Add",
            "sharesChange": "+450K",
            "tone": "primary",
        },
        {
            "institution": "Bridgewater Associates",
            "action": "Reduce",
            "sharesChange": "-120K",
            "tone": "negative",
        },
    ],
    "insiderTrades": [
        {
            "insider": "Senior Executive",
            "type": "Sale (10b5-1)",
            "value": "$8.2M",
            "tone": "neutral",
        },
        {
            "insider": "Board Director",
            "type": "Grant",
            "value": "$1.1M",
            "tone": "primary",
        },
    ],
    "timeline": [
        {
            "label": "Options Flow",
            "time": "2h ago",
            "description": "Unusual options activity detected across short-dated contracts.",
            "tone": "secondary",
        },
        {
            "label": "13F Update",
            "time": "2d ago",
            "description": "Top institutional funds increased exposure quarter-over-quarter.",
            "tone": "primary",
        },
        {
            "label": "Form 4",
            "time": "3d ago",
            "description": "Recent insider transaction detected through public filing.",
            "tone": "negative",
        },
    ],
}


STOCK_PROFILES = {
    "NVDA": {
        "ticker": "NVDA",
        "companyName": "NVIDIA Corporation",
        "category": "Technology / Semiconductors",
        "price": "$875.28",
        "changeAmount": "+24.15",
        "changePercent": "2.84%",
        "moneySignalScore": 92,
        "scoreLabel": "Strong Bullish",
        "executiveSummary": (
            "NVIDIA maintains strong momentum driven by unprecedented data center demand. "
            "Supply constraints are easing, and next-generation Blackwell architecture "
            "announcements are expected to serve as a positive near-term catalyst."
        ),
        "whyItMatters": (
            "Institutional accumulation remains extremely high. Option chain signals indicate "
            "aggressive short-dated call buying, suggesting anticipation of a near-term catalyst."
        ),
    },
    "PLTR": {
        "ticker": "PLTR",
        "companyName": "Palantir Technologies",
        "category": "Technology / AI Software",
        "price": "$21.84",
        "changeAmount": "+1.18",
        "changePercent": "5.84%",
        "moneySignalScore": 88,
        "scoreLabel": "Bullish",
        "executiveSummary": (
            "Palantir shows strong smart-money interest with rising institutional attention "
            "and improving commercial AI demand."
        ),
        "whyItMatters": (
            "Recent signals suggest increased conviction around Palantir's AI platform adoption "
            "and government/commercial expansion."
        ),
    },
    "TSLA": {
        "ticker": "TSLA",
        "companyName": "Tesla Inc.",
        "category": "Automotive / EV",
        "price": "$177.02",
        "changeAmount": "-2.55",
        "changePercent": "-1.42%",
        "moneySignalScore": 45,
        "scoreLabel": "Mixed Signal",
        "executiveSummary": (
            "Tesla shows conflicting disclosure signals. Selective institutional accumulation "
            "is offset by volatility, margin pressure, and uncertain demand trends."
        ),
        "whyItMatters": (
            "Tesla remains heavily watched by institutions, but signal quality is mixed due to "
            "valuation pressure and inconsistent public-market sentiment."
        ),
    },
    "AMD": {
        "ticker": "AMD",
        "companyName": "Advanced Micro Devices",
        "category": "Technology / Semiconductors",
        "price": "$162.30",
        "changeAmount": "+4.95",
        "changePercent": "3.15%",
        "moneySignalScore": 84,
        "scoreLabel": "Bullish",
        "executiveSummary": (
            "AMD shows positive smart-money rotation as institutional investors broaden "
            "semiconductor exposure beyond NVIDIA."
        ),
        "whyItMatters": (
            "AI infrastructure demand remains a major catalyst, and fund flows suggest growing "
            "interest in second-order semiconductor beneficiaries."
        ),
    },
    "MSFT": {
        "ticker": "MSFT",
        "companyName": "Microsoft Corporation",
        "category": "Cloud / AI Infrastructure",
        "price": "$421.12",
        "changeAmount": "+5.82",
        "changePercent": "1.40%",
        "moneySignalScore": 86,
        "scoreLabel": "Bullish",
        "executiveSummary": (
            "Microsoft continues to benefit from cloud strength and enterprise AI adoption."
        ),
        "whyItMatters": (
            "Institutional investors continue to view Microsoft as a core AI infrastructure "
            "and cloud platform holding."
        ),
    },
    "AAPL": {
        "ticker": "AAPL",
        "companyName": "Apple Inc.",
        "category": "Consumer Technology",
        "price": "$189.43",
        "changeAmount": "+1.70",
        "changePercent": "0.90%",
        "moneySignalScore": 78,
        "scoreLabel": "Moderate Bullish",
        "executiveSummary": (
            "Apple shows stable institutional interest with moderate disclosure momentum."
        ),
        "whyItMatters": (
            "Apple remains a defensive mega-cap technology holding, but AI-related upside is "
            "still being evaluated by the market."
        ),
    },
    "GOOGL": {
        "ticker": "GOOGL",
        "companyName": "Alphabet Inc.",
        "category": "Internet / Advertising",
        "price": "$174.55",
        "changeAmount": "+1.05",
        "changePercent": "0.60%",
        "moneySignalScore": 83,
        "scoreLabel": "Bullish",
        "executiveSummary": (
            "Alphabet shows continued institutional interest supported by search, cloud, "
            "and AI infrastructure exposure."
        ),
        "whyItMatters": (
            "Fund flows suggest investors are watching Alphabet as both an AI infrastructure "
            "and advertising recovery play."
        ),
    },
    "META": {
        "ticker": "META",
        "companyName": "Meta Platforms",
        "category": "Social / AI",
        "price": "$502.18",
        "changeAmount": "+10.35",
        "changePercent": "2.10%",
        "moneySignalScore": 89,
        "scoreLabel": "Strong Bullish",
        "executiveSummary": (
            "Meta shows strong momentum from AI-driven advertising efficiency and continued "
            "institutional accumulation."
        ),
        "whyItMatters": (
            "Smart-money signals suggest confidence in Meta's AI monetization and operating "
            "leverage story."
        ),
    },
}

@router.get("")
@router.get("/")
def list_stocks():
    stocks = []

    for profile in STOCK_PROFILES.values():
        stocks.append(
            {
                "ticker": profile["ticker"],
                "companyName": profile["companyName"],
                "category": profile["category"],
                "price": profile["price"],
                "changeAmount": profile["changeAmount"],
                "changePercent": profile["changePercent"],
                "moneySignalScore": profile["moneySignalScore"],
                "scoreLabel": profile["scoreLabel"],
            }
        )
    
    return sorted(
    stocks,
    key=lambda stock: stock["moneySignalScore"],
    reverse=True,
)

@router.get("/{ticker}")
def get_stock_detail(ticker: str):
    symbol = ticker.upper()

    profile = STOCK_PROFILES.get(
        symbol,
        {
            "ticker": symbol,
            "companyName": f"{symbol} Corporation",
            "category": "Unknown",
            "price": "$--",
            "changeAmount": "0.00",
            "changePercent": "0.00%",
            "moneySignalScore": 70,
            "scoreLabel": "Monitoring",
            "executiveSummary": f"{symbol} has been added to monitoring. More signal data will appear as filings and market activity are processed.",
            "whyItMatters": "This asset is now being tracked for institutional activity, insider trades, and AI-ranked disclosure signals.",
        },
    )

    return {
        **COMMON_STOCK_DETAIL,
        **profile,
    }