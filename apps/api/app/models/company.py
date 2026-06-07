from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)

    ticker = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    cik = Column(String(50), unique=True, index=True, nullable=True)
    cusip = Column(String(20), unique=True, index=True, nullable=True)

    sector = Column(String(100), nullable=True)
    industry = Column(String(150), nullable=True)
    exchange = Column(String(50), nullable=True)

    market_cap = Column(BigInteger, nullable=True)
    website = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    insiders = relationship("Insider", back_populates="company")
    insider_trades = relationship("InsiderTrade", back_populates="company")
    fund_holdings = relationship("FundHolding", back_populates="company")
    signals = relationship("Signal", back_populates="company")
    money_signal_scores = relationship(
        "MoneySignalScore",
        back_populates="company",
    )
    ai_insights = relationship("AIInsight", back_populates="company")
    watchlists = relationship("Watchlist", back_populates="company")
    alerts = relationship("Alert", back_populates="company")
    market_snapshots = relationship("MarketSnapshot", back_populates="company")