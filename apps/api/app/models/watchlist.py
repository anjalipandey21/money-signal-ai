from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)

    # For now this is a string until we add real auth/users later
    user_id = Column(String(100), nullable=False, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="watchlists")

    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_user_company_watchlist"),
    )