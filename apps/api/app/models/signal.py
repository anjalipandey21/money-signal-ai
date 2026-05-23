from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)

    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)

    signal_type = Column(String(100), nullable=False)
    source_type = Column(String(100), nullable=False)
    source_name = Column(String(255), nullable=False)
    signal_strength = Column(String(50), nullable=False)

    money_signal_score = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    stock = relationship("Stock", back_populates="signals")