from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    # Example: Insider Buy, Institutional Accumulation, Multi-Fund Buying
    signal_type = Column(String(100), nullable=False, index=True)

    # Example: INSIDER_TRADE, FUND_HOLDING, CONGRESSIONAL_TRADE, BUYBACK
    source_type = Column(String(100), nullable=False, index=True)

    # Stores the source record id, such as insider_trade.id or fund_holding.id
    source_id = Column(Integer, nullable=True, index=True)

    # Example: Jensen Huang, Berkshire Hathaway, BlackRock
    source_name = Column(String(255), nullable=True)

    # Example: bullish, bearish, neutral, mixed
    direction = Column(String(50), nullable=False, default="neutral")

    # 0 to 100 strength of this individual signal
    strength = Column(Numeric(5, 2), nullable=True)

    # 0 to 100 confidence in this signal
    confidence = Column(Numeric(5, 2), nullable=True)

    # How much this signal affects MoneySignal Score
    score_impact = Column(Numeric(6, 2), nullable=True)

    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)

    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="signals")