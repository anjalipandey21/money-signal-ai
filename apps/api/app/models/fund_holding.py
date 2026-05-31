from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class FundHolding(Base):
    __tablename__ = "fund_holdings"

    id = Column(Integer, primary_key=True, index=True)

    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    filing_id = Column(Integer, ForeignKey("fund_filings.id"), nullable=True, index=True)

    quarter = Column(String(20), nullable=True)  # Example: 2026-Q1

    shares = Column(Numeric(20, 4), nullable=True)
    market_value = Column(Numeric(18, 2), nullable=True)
    portfolio_weight = Column(Numeric(8, 4), nullable=True)

    previous_shares = Column(Numeric(20, 4), nullable=True)
    share_change = Column(Numeric(20, 4), nullable=True)
    change_percent = Column(Numeric(10, 4), nullable=True)

    # NEW, INCREASED, REDUCED, EXITED, UNCHANGED
    position_status = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    fund = relationship("Fund", back_populates="holdings")
    company = relationship("Company", back_populates="fund_holdings")
    filing = relationship("FundFiling", back_populates="holdings")