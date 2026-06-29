from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class ScrapeHistory(Base):
    __tablename__ = "scrape_history"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    ticker = Column(String(20), nullable=False, index=True)

    source_type = Column(String(100), nullable=False, default="SEC_FORM_4")
    status = Column(String(50), nullable=False, default="started")
    # started, processed, skipped, failed
    run_id = Column(String(64), nullable=True, index=True)
    trigger_source = Column(String(50), nullable=True)
    triggered_by = Column(String(255), nullable=True)

    filings_found = Column(Integer, default=0)
    filings_processed = Column(Integer, default=0)
    filings_skipped = Column(Integer, default=0)
    filings_failed = Column(Integer, default=0)
    records_created = Column(Integer, default=0)
    duration_seconds = Column(Float, nullable=True)
    details_json = Column(JSON, nullable=True)

    error_message = Column(Text, nullable=True)

    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
