from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    # For now this is a string until auth/users table is added
    user_id = Column(String(100), nullable=False, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    signal_id = Column(Integer, ForeignKey("signals.id"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)

    # Example: unread, read, dismissed
    status = Column(String(50), default="unread", index=True)

    # Example: signal, watchlist, score_change
    alert_type = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    read_at = Column(DateTime, nullable=True)

    company = relationship("Company", back_populates="alerts")
    signal = relationship("Signal", back_populates="alerts")