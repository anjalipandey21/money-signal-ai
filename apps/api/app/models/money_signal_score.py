from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class MoneySignalScore(Base):
    __tablename__ = "money_signal_scores"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    # Final 0-100 score
    score = Column(Numeric(5, 2), nullable=False)

    # Example: Weak, Moderate, Strong, Very Strong
    score_label = Column(String(100), nullable=True)

    institutional_score = Column(Numeric(5, 2), nullable=True)
    insider_score = Column(Numeric(5, 2), nullable=True)
    political_score = Column(Numeric(5, 2), nullable=True)
    activist_score = Column(Numeric(5, 2), nullable=True)
    buyback_score = Column(Numeric(5, 2), nullable=True)

    freshness_score = Column(Numeric(5, 2), nullable=True)
    confidence_score = Column(Numeric(5, 2), nullable=True)

    # Stores flexible score explanation
    # Example:
    # {
    #   "institutional": "+35 for multi-fund accumulation",
    #   "insider": "+20 for recent open-market buy"
    # }
    breakdown_json = Column(JSON, nullable=True)

    calculated_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="money_signal_scores")
    