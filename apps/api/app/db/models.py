from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True, nullable=False)
    company_name = Column(String, nullable=False)
    sector = Column(String, nullable=False)

    signals = relationship("Signal", back_populates="stock")


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)

    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)

    signal_type = Column(String, nullable=False)
    source_type = Column(String, nullable=False)
    source_name = Column(String, nullable=False)
    signal_strength = Column(String, nullable=False)

    money_signal_score = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    stock = relationship("Stock", back_populates="signals")