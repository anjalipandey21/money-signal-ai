from app.models import Company, MoneySignalScore, Signal


def get_top_signals(db, limit: int = 20):
    rows = (
        db.query(Signal, Company, MoneySignalScore)
        .join(Company, Signal.company_id == Company.id)
        .outerjoin(MoneySignalScore, MoneySignalScore.company_id == Company.id)
        .order_by(Signal.strength.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": signal.id,
            "ticker": company.ticker,
            "companyName": company.name,
            "sector": company.sector,
            "signalType": signal.signal_type,
            "sourceType": signal.source_type,
            "sourceName": signal.source_name,
            "direction": signal.direction,
            "strength": float(signal.strength or 0),
            "confidence": float(signal.confidence or 0),
            "scoreImpact": float(signal.score_impact or 0),
            "moneySignalScore": float(score.score) if score else None,
            "scoreLabel": score.score_label if score else None,
            "title": signal.title,
            "explanation": signal.explanation,
            "detectedAt": signal.detected_at.isoformat() if signal.detected_at else None,
        }
        for signal, company, score in rows
    ]


def get_signals_by_ticker(db, ticker: str):
    rows = (
        db.query(Signal, Company, MoneySignalScore)
        .join(Company, Signal.company_id == Company.id)
        .outerjoin(MoneySignalScore, MoneySignalScore.company_id == Company.id)
        .filter(Company.ticker == ticker.upper())
        .order_by(Signal.strength.desc())
        .all()
    )

    return [
        {
            "id": signal.id,
            "ticker": company.ticker,
            "companyName": company.name,
            "sector": company.sector,
            "signalType": signal.signal_type,
            "sourceType": signal.source_type,
            "sourceName": signal.source_name,
            "direction": signal.direction,
            "strength": float(signal.strength or 0),
            "confidence": float(signal.confidence or 0),
            "scoreImpact": float(signal.score_impact or 0),
            "moneySignalScore": float(score.score) if score else None,
            "scoreLabel": score.score_label if score else None,
            "title": signal.title,
            "explanation": signal.explanation,
            "detectedAt": signal.detected_at.isoformat() if signal.detected_at else None,
        }
        for signal, company, score in rows
    ]