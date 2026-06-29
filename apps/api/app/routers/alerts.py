from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models import Alert, Company, MoneySignalScore, Signal, User

router = APIRouter(prefix="/alerts", tags=["Alerts"])

DEMO_USER_ID = "demo-user"


@router.get("")
@router.get("/")
def get_alerts(db: Session = Depends(get_db)):
    rows = (
        db.query(Alert, Company, Signal, MoneySignalScore)
        .join(Company, Alert.company_id == Company.id)
        .outerjoin(Signal, Alert.signal_id == Signal.id)
        .outerjoin(MoneySignalScore, MoneySignalScore.company_id == Company.id)
        .filter(Alert.user_id == DEMO_USER_ID)
        .order_by(Alert.created_at.desc())
        .all()
    )

    return [
        {
            "id": alert.id,
            "ticker": company.ticker,
            "companyName": company.name,
            "title": alert.title,
            "message": alert.message,
            "status": alert.status,
            "alertType": alert.alert_type,
            "moneySignalScore": float(score.score) if score else None,
            "scoreLabel": score.score_label if score else None,
            "signalType": signal.signal_type if signal else None,
            "signalDirection": signal.direction if signal else "neutral",
            "createdAt": alert.created_at.isoformat() if alert.created_at else None,
            "readAt": alert.read_at.isoformat() if alert.read_at else None,
        }
        for alert, company, signal, score in rows
    ]


@router.get("/unread-count")
def get_unread_alert_count(db: Session = Depends(get_db)):
    count = (
        db.query(Alert)
        .filter(
            Alert.user_id == DEMO_USER_ID,
            Alert.status == "unread",
        )
        .count()
    )

    return {"unreadCount": count}


@router.patch("/{alert_id}/read")
def mark_alert_as_read(
    alert_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id,
            Alert.user_id == DEMO_USER_ID,
        )
        .first()
    )

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "read"

    from datetime import datetime

    alert.read_at = datetime.utcnow()

    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert marked as read",
        "alertId": alert.id,
        "status": alert.status,
    }


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id,
            Alert.user_id == DEMO_USER_ID,
        )
        .first()
    )

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()

    return {
        "message": "Alert deleted",
        "alertId": alert_id,
    }
