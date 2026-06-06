from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Numeric, String
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

    price = Column(Numeric(18, 4), nullable=True)
    change_amount = Column(Numeric(18, 4), nullable=True)
    change_percent = Column(Numeric(10, 4), nullable=True)

    currency = Column(String(10), nullable=False, default="USD")

    provider = Column(String(50), nullable=False)
    market_time = Column(DateTime, nullable=True)

    fetched_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    raw_payload = Column(JSON, nullable=True)

    company = relationship("Company", back_populates="market_snapshots")