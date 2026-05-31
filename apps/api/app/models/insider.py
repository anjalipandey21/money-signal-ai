from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class Insider(Base):
    __tablename__ = "insiders"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    relationship_to_company = Column(String(100), nullable=True)

    insider_cik = Column(String(50), nullable=True, index=True)

    is_director = Column(Boolean, default=False)
    is_officer = Column(Boolean, default=False)
    is_ten_percent_owner = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="insiders")
    trades = relationship("InsiderTrade", back_populates="insider")