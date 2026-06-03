from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    symbol = Column(String(20), nullable=False, index=True)

    price = Column(Float, nullable=True)
    change_amount = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)

    currency = Column(String(10), default="USD")
    provider = Column(String(50), default="alpha_vantage")

    market_time = Column(DateTime, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow, index=True)

    company = relationship("Company", back_populates="market_snapshots")