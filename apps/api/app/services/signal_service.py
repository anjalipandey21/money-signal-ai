from sqlalchemy.orm import Session

from app.models.signal import Signal
from app.models.stock import Stock


def get_dashboard_signals(db: Session):
    """
    Fetch dashboard signals from the database.

    This service layer keeps database/query logic out of the router.
    Router = API endpoint
    Service = business/database logic
    Model = database table
    """

    signals = (
        db.query(Signal)
        .join(Stock)
        .order_by(Signal.money_signal_score.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "id": signal.id,
            "ticker": signal.stock.ticker,
            "company_name": signal.stock.company_name,
            "sector": signal.stock.sector,
            "signal_type": signal.signal_type,
            "source_type": signal.source_type,
            "source_name": signal.source_name,
            "signal_strength": signal.signal_strength,
            "money_signal_score": signal.money_signal_score,
            "explanation": signal.explanation,
            "created_at": signal.created_at,
        }
        for signal in signals
    ]