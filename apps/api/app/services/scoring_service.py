from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import Company, MoneySignalScore, Signal


def clamp(value: float, minimum: float = 0, maximum: float = 100) -> float:
    return max(minimum, min(value, maximum))


def get_score_label(score: float) -> str:
    if score >= 80:
        return "Very Strong"
    if score >= 60:
        return "Strong"
    if score >= 40:
        return "Moderate"
    return "Weak"


def decimal_value(value) -> float:
    if value is None:
        return 0.0
    return float(value)


def calculate_freshness_score(signals: list[Signal]) -> float:
    if not signals:
        return 0.0

    latest_signal = max(
        [signal.detected_at for signal in signals if signal.detected_at],
        default=None,
    )

    if not latest_signal:
        return 0.0

    days_old = (datetime.utcnow() - latest_signal).days

    if days_old <= 7:
        return 10.0
    if days_old <= 30:
        return 7.0
    if days_old <= 90:
        return 4.0

    return 1.0


def calculate_confidence_score(signals: list[Signal]) -> float:
    if not signals:
        return 0.0

    confidence_values = [
        decimal_value(signal.confidence)
        for signal in signals
        if signal.confidence is not None
    ]

    if not confidence_values:
        return 0.0

    average_confidence = sum(confidence_values) / len(confidence_values)

    # Convert 0-100 confidence into 0-10 score contribution
    return clamp(average_confidence / 10, 0, 10)


def calculate_company_score(db: Session, company: Company) -> MoneySignalScore:
    signals = (
        db.query(Signal)
        .filter(Signal.company_id == company.id)
        .all()
    )

    institutional_score = 0.0
    insider_score = 0.0
    political_score = 0.0
    activist_score = 0.0
    buyback_score = 0.0

    positive_signal_count = 0
    negative_signal_count = 0

    for signal in signals:
        impact = decimal_value(signal.score_impact)

        if signal.direction == "bullish":
            positive_signal_count += 1
        elif signal.direction == "bearish":
            negative_signal_count += 1

        if signal.source_type == "FUND_HOLDING":
            institutional_score += impact
        elif signal.source_type == "INSIDER_TRADE":
            insider_score += impact
        elif signal.source_type == "CONGRESSIONAL_TRADE":
            political_score += impact
        elif signal.source_type == "ACTIVIST_STAKE":
            activist_score += impact
        elif signal.source_type == "BUYBACK":
            buyback_score += impact

    freshness_score = calculate_freshness_score(signals)
    confidence_score = calculate_confidence_score(signals)

    # Simple v1 scoring formula:
    # Start from neutral 50, then add/subtract signal impact.
    raw_score = (
        50
        + institutional_score
        + insider_score
        + political_score
        + activist_score
        + buyback_score
        + freshness_score
        + confidence_score
    )

    # Small conflict penalty when both bullish and bearish signals exist.
    conflict_penalty = 0.0
    if positive_signal_count > 0 and negative_signal_count > 0:
        conflict_penalty = 8.0
        raw_score -= conflict_penalty

    final_score = clamp(raw_score, 0, 100)
    score_label = get_score_label(final_score)

    breakdown = {
        "base": "50 neutral starting score",
        "institutional": institutional_score,
        "insider": insider_score,
        "political": political_score,
        "activist": activist_score,
        "buyback": buyback_score,
        "freshness": freshness_score,
        "confidence": confidence_score,
        "conflict_penalty": -conflict_penalty,
        "positive_signal_count": positive_signal_count,
        "negative_signal_count": negative_signal_count,
        "final_score": final_score,
    }

    existing_score = (
        db.query(MoneySignalScore)
        .filter(MoneySignalScore.company_id == company.id)
        .first()
    )

    if existing_score:
        existing_score.score = Decimal(str(final_score))
        existing_score.score_label = score_label
        existing_score.institutional_score = Decimal(str(institutional_score))
        existing_score.insider_score = Decimal(str(insider_score))
        existing_score.political_score = Decimal(str(political_score))
        existing_score.activist_score = Decimal(str(activist_score))
        existing_score.buyback_score = Decimal(str(buyback_score))
        existing_score.freshness_score = Decimal(str(freshness_score))
        existing_score.confidence_score = Decimal(str(confidence_score))
        existing_score.breakdown_json = breakdown
        existing_score.calculated_at = datetime.utcnow()

        db.flush()
        return existing_score

    new_score = MoneySignalScore(
        company_id=company.id,
        score=Decimal(str(final_score)),
        score_label=score_label,
        institutional_score=Decimal(str(institutional_score)),
        insider_score=Decimal(str(insider_score)),
        political_score=Decimal(str(political_score)),
        activist_score=Decimal(str(activist_score)),
        buyback_score=Decimal(str(buyback_score)),
        freshness_score=Decimal(str(freshness_score)),
        confidence_score=Decimal(str(confidence_score)),
        breakdown_json=breakdown,
        calculated_at=datetime.utcnow(),
    )

    db.add(new_score)
    db.flush()

    return new_score


def recalculate_all_scores(db: Session):
    companies = db.query(Company).all()

    results = []

    for company in companies:
        score = calculate_company_score(db, company)

        results.append(
            {
                "ticker": company.ticker,
                "companyName": company.name,
                "score": float(score.score),
                "scoreLabel": score.score_label,
                "breakdown": score.breakdown_json,
            }
        )

    db.commit()

    return results


def recalculate_score_by_ticker(db: Session, ticker: str):
    company = (
        db.query(Company)
        .filter(Company.ticker == ticker.upper())
        .first()
    )

    if not company:
        return None

    score = calculate_company_score(db, company)
    db.commit()

    return {
        "ticker": company.ticker,
        "companyName": company.name,
        "score": float(score.score),
        "scoreLabel": score.score_label,
        "breakdown": score.breakdown_json,
    }