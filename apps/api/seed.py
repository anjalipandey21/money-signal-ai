from app.db.database import Base, SessionLocal, engine
from app.models.signal import Signal
from app.models.stock import Stock

Base.metadata.create_all(bind=engine)

db = SessionLocal()

seed_data = [
    {
        "ticker": "NVDA",
        "company_name": "Nvidia",
        "sector": "Semiconductors",
        "signal_type": "Institutional Accumulation",
        "source_type": "13F Filing",
        "source_name": "Multiple Funds",
        "signal_strength": "High",
        "money_signal_score": 88,
        "explanation": "Multiple funds increased exposure this quarter with no major insider selling pressure.",
    },
    {
        "ticker": "GOOGL",
        "company_name": "Alphabet",
        "sector": "Technology",
        "signal_type": "High-Conviction Fund Buy",
        "source_type": "13F Filing",
        "source_name": "Institutional Managers",
        "signal_strength": "High",
        "money_signal_score": 84,
        "explanation": "Large institutional managers opened or increased positions, suggesting stronger fund interest.",
    },
    {
        "ticker": "MSFT",
        "company_name": "Microsoft",
        "sector": "Cloud / AI",
        "signal_type": "Insider Confidence",
        "source_type": "Insider Trade",
        "source_name": "Director Transaction",
        "signal_strength": "Medium",
        "money_signal_score": 81,
        "explanation": "Recent insider activity is neutral-to-positive while institutional ownership remains strong.",
    },
    {
        "ticker": "TSLA",
        "company_name": "Tesla",
        "sector": "Automotive / Energy",
        "signal_type": "Mixed Smart-Money Signal",
        "source_type": "13F Filing",
        "source_name": "Institutional Managers",
        "signal_strength": "Medium",
        "money_signal_score": 69,
        "explanation": "Institutional activity is mixed, with some funds reducing exposure while others maintain positions.",
    },
    {
        "ticker": "AAPL",
        "company_name": "Apple",
        "sector": "Consumer Technology",
        "signal_type": "Stable Institutional Holding",
        "source_type": "13F Filing",
        "source_name": "Large Asset Managers",
        "signal_strength": "Medium",
        "money_signal_score": 76,
        "explanation": "Large funds continue to hold Apple as a core position with limited recent insider pressure.",
    },
]

for item in seed_data:
    stock = db.query(Stock).filter(Stock.ticker == item["ticker"]).first()

    if not stock:
        stock = Stock(
            ticker=item["ticker"],
            company_name=item["company_name"],
            sector=item["sector"],
        )
        db.add(stock)
        db.commit()
        db.refresh(stock)

    existing_signal = (
        db.query(Signal)
        .filter(
            Signal.stock_id == stock.id,
            Signal.signal_type == item["signal_type"],
        )
        .first()
    )

    if not existing_signal:
        signal = Signal(
            stock_id=stock.id,
            signal_type=item["signal_type"],
            source_type=item["source_type"],
            source_name=item["source_name"],
            signal_strength=item["signal_strength"],
            money_signal_score=item["money_signal_score"],
            explanation=item["explanation"],
        )

        db.add(signal)

db.commit()
db.close()

print("Supabase database seeded successfully.")