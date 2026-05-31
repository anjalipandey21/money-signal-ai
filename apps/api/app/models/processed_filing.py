from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Integer, String, UniqueConstraint

from app.db.database import Base


class ProcessedFiling(Base):
    __tablename__ = "processed_filings"

    id = Column(Integer, primary_key=True, index=True)

    source_type = Column(String(100), nullable=False, index=True)
    # Examples: SEC_FORM_4, SEC_13F, CONGRESSIONAL, BUYBACK

    form_type = Column(String(50), nullable=True)
    # Examples: Form 4, 13F-HR, 13D, 13G

    accession_number = Column(String(100), nullable=True, index=True)
    filing_url = Column(String(1000), nullable=True, index=True)

    ticker = Column(String(20), nullable=True, index=True)
    filing_date = Column(Date, nullable=True)

    processing_status = Column(String(50), default="processed")
    # processed, failed, skipped

    records_created = Column(Integer, default=0)

    error_message = Column(String(1000), nullable=True)

    processed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("accession_number", name="uq_processed_filing_accession_number"),
        UniqueConstraint("filing_url", name="uq_processed_filing_url"),
    )