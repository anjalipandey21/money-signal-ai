import os
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import AIInsight, Company, MoneySignalScore, Signal
from app.services.llm_provider import LLMProviderError, generate_llm_explanation


def get_signal_phrase(signal: Signal) -> str:
    if signal.direction == "bullish":
        return f"positive {signal.signal_type.lower()}"

    if signal.direction == "bearish":
        return f"negative {signal.signal_type.lower()}"

    return f"neutral {signal.signal_type.lower()}"


def build_summary(company: Company, score: MoneySignalScore | None, signals: list[Signal]) -> str:
    if not signals:
        return (
            f"{company.ticker} is currently being monitored, but there are not enough "
            "recent money-movement signals to generate a strong summary."
        )

    bullish_count = len([signal for signal in signals if signal.direction == "bullish"])
    bearish_count = len([signal for signal in signals if signal.direction == "bearish"])

    score_text = f" with a MoneySignal Score of {float(score.score):.0f}/100" if score else ""

    strongest_signal = max(
        signals,
        key=lambda signal: float(signal.strength or 0),
    )

    if bullish_count > bearish_count:
        tone = "shows a strong positive smart-money profile"
    elif bearish_count > bullish_count:
        tone = "shows a cautious or weaker smart-money profile"
    else:
        tone = "shows a mixed smart-money profile"

    return (
        f"{company.ticker} {tone}{score_text}. The strongest current signal is "
        f"{strongest_signal.signal_type.lower()} from {strongest_signal.source_name or 'a tracked source'}."
    )


def build_why_it_matters(company: Company, signals: list[Signal]) -> str:
    if not signals:
        return (
            "This matters because MoneySignal AI tracks public disclosures and money-movement "
            "patterns, but this company does not yet have enough structured signals."
        )

    source_types = {signal.source_type for signal in signals}

    reasons = []

    if "FUND_HOLDING" in source_types:
        reasons.append(
            "institutional holdings can show where large funds are increasing, reducing, or maintaining exposure"
        )

    if "INSIDER_TRADE" in source_types:
        reasons.append(
            "insider trades can provide context about management confidence or selling pressure"
        )

    if "CONGRESSIONAL_TRADE" in source_types:
        reasons.append(
            "political trades may highlight policy-sensitive market activity"
        )

    if not reasons:
        reasons.append(
            "these signals help convert public disclosures into easier research insights"
        )

    return (
        f"This matters because {', and '.join(reasons)}. "
        f"For {company.ticker}, the current signal mix helps users understand whether smart-money activity is strengthening, weakening, or staying neutral."
    )


def build_watch_next(signals: list[Signal]) -> str:
    if not signals:
        return "Watch for new SEC filings, insider Form 4 reports, and future 13F updates."

    has_fund_signal = any(signal.source_type == "FUND_HOLDING" for signal in signals)
    has_insider_signal = any(signal.source_type == "INSIDER_TRADE" for signal in signals)
    has_bearish_signal = any(signal.direction == "bearish" for signal in signals)

    watch_items = []

    if has_fund_signal:
        watch_items.append("whether more funds increase or reduce exposure in the next 13F cycle")

    if has_insider_signal:
        watch_items.append("whether insider buying continues or turns into selling pressure")

    if has_bearish_signal:
        watch_items.append("whether negative signals are offset by stronger positive institutional activity")

    if not watch_items:
        watch_items.append("whether new disclosures create stronger directional signals")

    return "Watch " + "; ".join(watch_items) + "."


def generate_ai_insight_for_company(db: Session, company: Company) -> AIInsight:
    signals = (
        db.query(Signal)
        .filter(Signal.company_id == company.id)
        .order_by(Signal.detected_at.desc())
        .all()
    )

    score = (
        db.query(MoneySignalScore)
        .filter(MoneySignalScore.company_id == company.id)
        .order_by(MoneySignalScore.calculated_at.desc())
        .first()
    )

    company_payload = build_company_payload(company, score, signals)

    try:
        llm_result = generate_llm_explanation(company_payload)

        summary = llm_result["summary"]
        why_it_matters = llm_result["why_it_matters"]
        watch_next = llm_result["watch_next"]
        limitations = llm_result["limitations"]
        provider = os.getenv("LLM_PROVIDER", "template").lower()

        if provider == "openai":
            model_name = os.getenv("OPENAI_MODEL", "gpt-5")
        elif provider == "gemini":
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        else:
            model_name = "money-signal-template-ai-v1"

    except LLMProviderError:
        summary = build_summary(company, score, signals)
        why_it_matters = build_why_it_matters(company, signals)
        watch_next = build_watch_next(signals)
        limitations = (
            "This is a research intelligence summary based on public-disclosure-style signals. "
            "It is not financial advice, not a stock prediction, and not a buy/sell recommendation."
        )
        model_name = "money-signal-template-ai-v1"

    existing = (
        db.query(AIInsight)
        .filter(AIInsight.company_id == company.id)
        .order_by(AIInsight.created_at.desc())
        .first()
    )

    if existing:
        existing.summary = summary
        existing.why_it_matters = why_it_matters
        existing.watch_next = watch_next
        existing.limitations = limitations
        existing.model_name = "money-signal-template-ai-v1"
        existing.created_at = datetime.utcnow()

        db.flush()
        return existing

    insight = AIInsight(
        company_id=company.id,
        summary=summary,
        why_it_matters=why_it_matters,
        watch_next=watch_next,
        limitations=limitations,
        model_name="money-signal-template-ai-v1",
    )

    db.add(insight)
    db.flush()

    return insight


def generate_ai_insight_by_ticker(db: Session, ticker: str):
    company = (
        db.query(Company)
        .filter(Company.ticker == ticker.upper())
        .first()
    )

    if not company:
        return None

    insight = generate_ai_insight_for_company(db, company)
    db.commit()

    return {
        "ticker": company.ticker,
        "companyName": company.name,
        "summary": insight.summary,
        "whyItMatters": insight.why_it_matters,
        "watchNext": insight.watch_next,
        "limitations": insight.limitations,
        "modelName": insight.model_name,
        "createdAt": insight.created_at.isoformat() if insight.created_at else None,
    }


def generate_ai_insights_for_all_companies(db: Session):
    companies = db.query(Company).all()

    results = []

    for company in companies:
        insight = generate_ai_insight_for_company(db, company)

        results.append(
            {
                "ticker": company.ticker,
                "companyName": company.name,
                "summary": insight.summary,
                "whyItMatters": insight.why_it_matters,
                "watchNext": insight.watch_next,
                "limitations": insight.limitations,
                "modelName": insight.model_name,
                "createdAt": insight.created_at.isoformat() if insight.created_at else None,
            }
        )

    db.commit()

    return results

def build_company_payload(company: Company, score: MoneySignalScore | None, signals: list[Signal]):
    return {
        "ticker": company.ticker,
        "company_name": company.name,
        "sector": company.sector,
        "industry": company.industry,
        "money_signal_score": float(score.score) if score else None,
        "score_label": score.score_label if score else None,
        "signals": [
            {
                "signal_type": signal.signal_type,
                "source_type": signal.source_type,
                "source_name": signal.source_name,
                "direction": signal.direction,
                "strength": float(signal.strength or 0),
                "confidence": float(signal.confidence or 0),
                "score_impact": float(signal.score_impact or 0),
                "title": signal.title,
                "explanation": signal.explanation,
                "detected_at": signal.detected_at.isoformat()
                if signal.detected_at
                else None,
            }
            for signal in signals
        ],
    }
