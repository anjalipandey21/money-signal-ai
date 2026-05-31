from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class FundFiling(Base):
    __tablename__ = "fund_filings"

    id = Column(Integer, primary_key=True, index=True)

    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False, index=True)

    form_type = Column(String(50), nullable=False)  # Example: 13F-HR
    filing_date = Column(Date, nullable=False)
    period_end_date = Column(Date, nullable=True)

    accession_number = Column(String(100), unique=True, index=True, nullable=True)
    filing_url = Column(String(1000), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    fund = relationship("Fund", back_populates="filings")
    holdings = relationship("FundHolding", back_populates="filing")