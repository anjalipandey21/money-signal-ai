from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Company
from app.services.market_data_service import get_latest_market_snapshot


router = APIRouter(prefix="/data-health", tags=["Data Health"])


def _age_minutes(fetched_at):
    if not fetched_at:
        return None

    now = datetime.now(timezone.utc)

    if fetched_at.tzinfo is None:
        fetched_at = fetched_at.replace(tzinfo=timezone.utc)

    diff = now - fetched_at

    return int(diff.total_seconds() // 60)


def _status_from_age(age_minutes):
    if age_minutes is None:
        return "pending"

    if age_minutes <= 60 * 24:
        return "fresh"

    if age_minutes <= 60 * 24 * 7:
        return "stale"

    return "outdated"


@router.get("/market")
def get_market_data_health(db: Session = Depends(get_db)):
    companies = db.query(Company).order_by(Company.ticker.asc()).all()

    rows = []
    summary = {
        "total": len(companies),
        "fresh": 0,
        "stale": 0,
        "outdated": 0,
        "pending": 0,
    }

    for company in companies:
        snapshot = get_latest_market_snapshot(db, company.id)

        age_minutes = _age_minutes(snapshot.fetched_at) if snapshot else None
        status = _status_from_age(age_minutes)

        summary[status] += 1

        rows.append(
            {
                "ticker": company.ticker,
                "companyName": company.name,
                "status": status,
                "provider": snapshot.provider if snapshot else None,
                "price": snapshot.price if snapshot else None,
                "fetchedAt": snapshot.fetched_at.isoformat()
                if snapshot and snapshot.fetched_at
                else None,
                "ageMinutes": age_minutes,
            }
        )

    return {
        "summary": summary,
        "items": rows,
    }