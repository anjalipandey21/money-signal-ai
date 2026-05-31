from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class InsiderTrade(Base):
    __tablename__ = "insider_trades"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    insider_id = Column(Integer, ForeignKey("insiders.id"), nullable=False, index=True)

    transaction_date = Column(Date, nullable=False)
    filing_date = Column(Date, nullable=True)

    transaction_type = Column(String(50), nullable=False)
    transaction_code = Column(String(20), nullable=True)

    shares = Column(Numeric(20, 4), nullable=True)
    price_per_share = Column(Numeric(18, 4), nullable=True)
    total_value = Column(Numeric(18, 2), nullable=True)
    shares_owned_after = Column(Numeric(20, 4), nullable=True)

    ownership_type = Column(String(100), nullable=True)
    derivative_transaction = Column(Boolean, default=False)

    accession_number = Column(String(100), nullable=True, index=True)
    sec_filing_url = Column(String(1000), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="insider_trades")
    insider = relationship("Insider", back_populates="trades")