from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    # Optional: later this can point to a specific signal id
    signal_id = Column(Integer, nullable=True, index=True)

    summary = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=True)
    watch_next = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)

    model_name = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    company = relationship("Company", back_populates="ai_insights")