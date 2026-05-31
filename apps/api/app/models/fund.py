from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class Fund(Base):
    __tablename__ = "funds"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False, index=True)
    cik = Column(String(50), unique=True, index=True, nullable=True)

    manager_name = Column(String(255), nullable=True)
    fund_type = Column(String(100), nullable=True)
    website = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    filings = relationship("FundFiling", back_populates="fund")
    holdings = relationship("FundHolding", back_populates="fund")