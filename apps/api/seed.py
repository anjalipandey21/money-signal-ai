from datetime import date
from decimal import Decimal
from app.models import MarketSnapshot
from app.models.market_snapshot import MarketSnapshot

from app.db.database import Base, SessionLocal, engine
from app.models import (
    AIInsight,
    Alert,
    Company,
    Fund,
    FundFiling,
    FundHolding,
    Insider,
    InsiderTrade,
    MoneySignalScore,
    ProcessedFiling,
    Signal,
    Watchlist,
)

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()

    try:
        # Clear demo data in dependency order
        db.query(MarketSnapshot).delete()
        db.query(Alert).delete()
        db.query(Watchlist).delete()
        db.query(AIInsight).delete()
        db.query(MoneySignalScore).delete()
        db.query(Signal).delete()
        db.query(ProcessedFiling).delete()
        db.query(InsiderTrade).delete()
        db.query(Insider).delete()
        db.query(FundHolding).delete()
        db.query(FundFiling).delete()
        db.query(Fund).delete()
        db.query(Company).delete()
        db.commit()

        # -----------------------------
        # Companies
        # -----------------------------
        nvda = Company(
            ticker="NVDA",
            name="NVIDIA Corporation",
            cik="1045810",
            sector="Technology",
            industry="Semiconductors",
            exchange="NASDAQ",
            market_cap=3000000000000,
            website="https://www.nvidia.com",
        )

        googl = Company(
            ticker="GOOGL",
            name="Alphabet Inc.",
            cik="1652044",
            sector="Communication Services",
            industry="Internet Content & Information",
            exchange="NASDAQ",
            market_cap=2200000000000,
            website="https://abc.xyz",
        )

        msft = Company(
            ticker="MSFT",
            name="Microsoft Corporation",
            cik="789019",
            sector="Technology",
            industry="Software Infrastructure",
            exchange="NASDAQ",
            market_cap=3100000000000,
            website="https://www.microsoft.com",
        )

        aapl = Company(
            ticker="AAPL",
            name="Apple Inc.",
            cik="320193",
            sector="Technology",
            industry="Consumer Electronics",
            exchange="NASDAQ",
            market_cap=2900000000000,
            website="https://www.apple.com",
        )

        tsla = Company(
            ticker="TSLA",
            name="Tesla Inc.",
            cik="1318605",
            sector="Consumer Cyclical",
            industry="Auto Manufacturers",
            exchange="NASDAQ",
            market_cap=800000000000,
            website="https://www.tesla.com",
        )

        db.add_all([nvda, googl, msft, aapl, tsla])
        db.flush()

        # -----------------------------
        # Funds
        # -----------------------------
        tiger = Fund(
            name="Tiger Global Management",
            cik="1167483",
            manager_name="Chase Coleman",
            fund_type="Hedge Fund",
        )

        pershing = Fund(
            name="Pershing Square Capital Management",
            cik="1336528",
            manager_name="Bill Ackman",
            fund_type="Hedge Fund",
        )

        berkshire = Fund(
            name="Berkshire Hathaway",
            cik="1067983",
            manager_name="Warren Buffett",
            fund_type="Holding Company",
        )

        db.add_all([tiger, pershing, berkshire])
        db.flush()

        # -----------------------------
        # Fund filings
        # -----------------------------
        tiger_filing = FundFiling(
            fund_id=tiger.id,
            form_type="13F-HR",
            filing_date=date(2026, 5, 15),
            period_end_date=date(2026, 3, 31),
            accession_number="0001167483-26-000001",
            filing_url="https://www.sec.gov/demo/tiger-13f",
        )

        pershing_filing = FundFiling(
            fund_id=pershing.id,
            form_type="13F-HR",
            filing_date=date(2026, 5, 15),
            period_end_date=date(2026, 3, 31),
            accession_number="0001336528-26-000001",
            filing_url="https://www.sec.gov/demo/pershing-13f",
        )

        berkshire_filing = FundFiling(
            fund_id=berkshire.id,
            form_type="13F-HR",
            filing_date=date(2026, 5, 15),
            period_end_date=date(2026, 3, 31),
            accession_number="0001067983-26-000001",
            filing_url="https://www.sec.gov/demo/berkshire-13f",
        )

        db.add_all([tiger_filing, pershing_filing, berkshire_filing])
        db.flush()

        # -----------------------------
        # Fund holdings
        # -----------------------------
        nvda_holding = FundHolding(
            fund_id=tiger.id,
            company_id=nvda.id,
            filing_id=tiger_filing.id,
            quarter="2026-Q1",
            shares=Decimal("1500000"),
            market_value=Decimal("1320000000"),
            portfolio_weight=Decimal("8.75"),
            previous_shares=Decimal("900000"),
            share_change=Decimal("600000"),
            change_percent=Decimal("66.67"),
            position_status="INCREASED",
        )

        googl_holding = FundHolding(
            fund_id=pershing.id,
            company_id=googl.id,
            filing_id=pershing_filing.id,
            quarter="2026-Q1",
            shares=Decimal("2200000"),
            market_value=Decimal("385000000"),
            portfolio_weight=Decimal("11.20"),
            previous_shares=Decimal("0"),
            share_change=Decimal("2200000"),
            change_percent=Decimal("100.00"),
            position_status="NEW",
        )

        msft_holding = FundHolding(
            fund_id=tiger.id,
            company_id=msft.id,
            filing_id=tiger_filing.id,
            quarter="2026-Q1",
            shares=Decimal("800000"),
            market_value=Decimal("340000000"),
            portfolio_weight=Decimal("5.10"),
            previous_shares=Decimal("800000"),
            share_change=Decimal("0"),
            change_percent=Decimal("0.00"),
            position_status="UNCHANGED",
        )

        aapl_holding = FundHolding(
            fund_id=berkshire.id,
            company_id=aapl.id,
            filing_id=berkshire_filing.id,
            quarter="2026-Q1",
            shares=Decimal("400000000"),
            market_value=Decimal("76000000000"),
            portfolio_weight=Decimal("38.50"),
            previous_shares=Decimal("410000000"),
            share_change=Decimal("-10000000"),
            change_percent=Decimal("-2.44"),
            position_status="REDUCED",
        )

        tsla_holding = FundHolding(
            fund_id=pershing.id,
            company_id=tsla.id,
            filing_id=pershing_filing.id,
            quarter="2026-Q1",
            shares=Decimal("250000"),
            market_value=Decimal("45000000"),
            portfolio_weight=Decimal("1.30"),
            previous_shares=Decimal("500000"),
            share_change=Decimal("-250000"),
            change_percent=Decimal("-50.00"),
            position_status="REDUCED",
        )

        db.add_all(
            [
                nvda_holding,
                googl_holding,
                msft_holding,
                aapl_holding,
                tsla_holding,
            ]
        )
        db.flush()

        # -----------------------------
        # Insiders
        # -----------------------------
        nvda_insider = Insider(
            company_id=nvda.id,
            name="Colette Kress",
            title="Chief Financial Officer",
            relationship_to_company="Officer",
            insider_cik="0000000001",
            is_director=False,
            is_officer=True,
            is_ten_percent_owner=False,
        )

        googl_insider = Insider(
            company_id=googl.id,
            name="Ruth Porat",
            title="President and Chief Investment Officer",
            relationship_to_company="Officer",
            insider_cik="0000000002",
            is_director=False,
            is_officer=True,
            is_ten_percent_owner=False,
        )

        msft_insider = Insider(
            company_id=msft.id,
            name="Amy Hood",
            title="Chief Financial Officer",
            relationship_to_company="Officer",
            insider_cik="0000000003",
            is_director=False,
            is_officer=True,
            is_ten_percent_owner=False,
        )

        db.add_all([nvda_insider, googl_insider, msft_insider])
        db.flush()

        # -----------------------------
        # Insider trades
        # -----------------------------
        nvda_trade = InsiderTrade(
            company_id=nvda.id,
            insider_id=nvda_insider.id,
            transaction_date=date(2026, 5, 10),
            filing_date=date(2026, 5, 12),
            transaction_type="Open Market Purchase",
            transaction_code="P",
            shares=Decimal("2500"),
            price_per_share=Decimal("880.00"),
            total_value=Decimal("2200000"),
            shares_owned_after=Decimal("125000"),
            ownership_type="Direct",
            derivative_transaction=False,
            accession_number="0001045810-26-000101",
            sec_filing_url="https://www.sec.gov/demo/nvda-form4",
        )

        googl_trade = InsiderTrade(
            company_id=googl.id,
            insider_id=googl_insider.id,
            transaction_date=date(2026, 5, 8),
            filing_date=date(2026, 5, 10),
            transaction_type="Open Market Purchase",
            transaction_code="P",
            shares=Decimal("1200"),
            price_per_share=Decimal("175.00"),
            total_value=Decimal("210000"),
            shares_owned_after=Decimal("95000"),
            ownership_type="Direct",
            derivative_transaction=False,
            accession_number="0001652044-26-000101",
            sec_filing_url="https://www.sec.gov/demo/googl-form4",
        )

        msft_trade = InsiderTrade(
            company_id=msft.id,
            insider_id=msft_insider.id,
            transaction_date=date(2026, 5, 5),
            filing_date=date(2026, 5, 7),
            transaction_type="Planned Sale",
            transaction_code="S",
            shares=Decimal("1800"),
            price_per_share=Decimal("425.00"),
            total_value=Decimal("765000"),
            shares_owned_after=Decimal("60000"),
            ownership_type="Direct",
            derivative_transaction=False,
            accession_number="0000789019-26-000101",
            sec_filing_url="https://www.sec.gov/demo/msft-form4",
        )

        db.add_all([nvda_trade, googl_trade, msft_trade])
        db.flush()

        # -----------------------------
        # Processed filings
        # -----------------------------
        db.add_all(
            [
                ProcessedFiling(
                    source_type="SEC_13F",
                    form_type="13F-HR",
                    accession_number="0001167483-26-000001",
                    filing_url="https://www.sec.gov/demo/tiger-13f",
                    ticker="NVDA",
                    filing_date=date(2026, 5, 15),
                    processing_status="processed",
                    records_created=2,
                ),
                ProcessedFiling(
                    source_type="SEC_13F",
                    form_type="13F-HR",
                    accession_number="0001336528-26-000001",
                    filing_url="https://www.sec.gov/demo/pershing-13f",
                    ticker="GOOGL",
                    filing_date=date(2026, 5, 15),
                    processing_status="processed",
                    records_created=2,
                ),
                ProcessedFiling(
                    source_type="SEC_13F",
                    form_type="13F-HR",
                    accession_number="0001067983-26-000001",
                    filing_url="https://www.sec.gov/demo/berkshire-13f",
                    ticker="AAPL",
                    filing_date=date(2026, 5, 15),
                    processing_status="processed",
                    records_created=1,
                ),
                ProcessedFiling(
                    source_type="SEC_FORM_4",
                    form_type="Form 4",
                    accession_number="0001045810-26-000101",
                    filing_url="https://www.sec.gov/demo/nvda-form4",
                    ticker="NVDA",
                    filing_date=date(2026, 5, 12),
                    processing_status="processed",
                    records_created=1,
                ),
            ]
        )

        # -----------------------------
        # Signals
        # -----------------------------
        nvda_signal_1 = Signal(
            company_id=nvda.id,
            signal_type="Institutional Accumulation",
            source_type="FUND_HOLDING",
            source_id=nvda_holding.id,
            source_name="Tiger Global Management",
            direction="bullish",
            strength=Decimal("92"),
            confidence=Decimal("88"),
            score_impact=Decimal("35"),
            title="Tiger Global increased NVDA position",
            explanation="Tiger Global increased its NVDA position this quarter, suggesting stronger institutional conviction.",
        )

        nvda_signal_2 = Signal(
            company_id=nvda.id,
            signal_type="Insider Buy",
            source_type="INSIDER_TRADE",
            source_id=nvda_trade.id,
            source_name="Colette Kress",
            direction="bullish",
            strength=Decimal("82"),
            confidence=Decimal("76"),
            score_impact=Decimal("22"),
            title="NVIDIA CFO reported an open-market purchase",
            explanation="A recent open-market insider purchase adds a positive management-confidence signal.",
        )

        googl_signal_1 = Signal(
            company_id=googl.id,
            signal_type="High-Conviction New Position",
            source_type="FUND_HOLDING",
            source_id=googl_holding.id,
            source_name="Pershing Square Capital Management",
            direction="bullish",
            strength=Decimal("89"),
            confidence=Decimal("84"),
            score_impact=Decimal("32"),
            title="Pershing Square opened a new GOOGL position",
            explanation="A new position from a concentrated fund can indicate strong institutional attention.",
        )

        googl_signal_2 = Signal(
            company_id=googl.id,
            signal_type="Insider Buy",
            source_type="INSIDER_TRADE",
            source_id=googl_trade.id,
            source_name="Ruth Porat",
            direction="bullish",
            strength=Decimal("74"),
            confidence=Decimal("70"),
            score_impact=Decimal("18"),
            title="Alphabet insider reported an open-market purchase",
            explanation="The insider purchase adds a positive signal on top of institutional interest.",
        )

        msft_signal = Signal(
            company_id=msft.id,
            signal_type="Stable Institutional Holding",
            source_type="FUND_HOLDING",
            source_id=msft_holding.id,
            source_name="Tiger Global Management",
            direction="neutral",
            strength=Decimal("68"),
            confidence=Decimal("75"),
            score_impact=Decimal("10"),
            title="Tiger Global maintained MSFT position",
            explanation="The fund maintained its Microsoft position, suggesting steady but not aggressive accumulation.",
        )

        aapl_signal = Signal(
            company_id=aapl.id,
            signal_type="Reduced Core Holding",
            source_type="FUND_HOLDING",
            source_id=aapl_holding.id,
            source_name="Berkshire Hathaway",
            direction="mixed",
            strength=Decimal("65"),
            confidence=Decimal("78"),
            score_impact=Decimal("-8"),
            title="Berkshire slightly reduced Apple holdings",
            explanation="Apple remains a large core holding, but the reduction creates a mixed signal instead of a purely bullish signal.",
        )

        tsla_signal = Signal(
            company_id=tsla.id,
            signal_type="Institutional Selling Pressure",
            source_type="FUND_HOLDING",
            source_id=tsla_holding.id,
            source_name="Pershing Square Capital Management",
            direction="bearish",
            strength=Decimal("71"),
            confidence=Decimal("73"),
            score_impact=Decimal("-18"),
            title="Pershing Square reduced TSLA exposure",
            explanation="A reduced fund position may indicate lower institutional conviction or portfolio rebalancing.",
        )

        db.add_all(
            [
                nvda_signal_1,
                nvda_signal_2,
                googl_signal_1,
                googl_signal_2,
                msft_signal,
                aapl_signal,
                tsla_signal,
            ]
        )
        db.flush()

        # -----------------------------
        # MoneySignal Scores
        # -----------------------------
        db.add_all(
            [
                MoneySignalScore(
                    company_id=nvda.id,
                    score=Decimal("88"),
                    score_label="Very Strong",
                    institutional_score=Decimal("43"),
                    insider_score=Decimal("24"),
                    political_score=Decimal("0"),
                    activist_score=Decimal("0"),
                    buyback_score=Decimal("0"),
                    freshness_score=Decimal("11"),
                    confidence_score=Decimal("10"),
                    breakdown_json={
                        "institutional": "+43 from increased hedge fund position",
                        "insider": "+24 from recent open-market insider purchase",
                        "freshness": "+11 because signals are recent",
                        "confidence": "+10 based on source quality",
                    },
                ),
                MoneySignalScore(
                    company_id=googl.id,
                    score=Decimal("84"),
                    score_label="Very Strong",
                    institutional_score=Decimal("42"),
                    insider_score=Decimal("19"),
                    political_score=Decimal("0"),
                    activist_score=Decimal("0"),
                    buyback_score=Decimal("0"),
                    freshness_score=Decimal("12"),
                    confidence_score=Decimal("11"),
                    breakdown_json={
                        "institutional": "+42 from high-conviction new fund position",
                        "insider": "+19 from insider purchase",
                        "freshness": "+12 because signals are recent",
                        "confidence": "+11 based on source quality",
                    },
                ),
                MoneySignalScore(
                    company_id=msft.id,
                    score=Decimal("74"),
                    score_label="Strong",
                    institutional_score=Decimal("28"),
                    insider_score=Decimal("5"),
                    political_score=Decimal("0"),
                    activist_score=Decimal("0"),
                    buyback_score=Decimal("0"),
                    freshness_score=Decimal("10"),
                    confidence_score=Decimal("9"),
                    breakdown_json={
                        "institutional": "+28 from stable institutional holding",
                        "insider": "+5 because insider activity is not strongly bullish",
                        "freshness": "+10 for recent filings",
                    },
                ),
                MoneySignalScore(
                    company_id=aapl.id,
                    score=Decimal("69"),
                    score_label="Moderate",
                    institutional_score=Decimal("22"),
                    insider_score=Decimal("6"),
                    political_score=Decimal("0"),
                    activist_score=Decimal("0"),
                    buyback_score=Decimal("0"),
                    freshness_score=Decimal("9"),
                    confidence_score=Decimal("8"),
                    breakdown_json={
                        "institutional": "+22 because Apple remains a core holding but was reduced",
                        "insider": "+6 neutral insider activity",
                        "negative": "-8 from reduced institutional exposure",
                    },
                ),
                MoneySignalScore(
                    company_id=tsla.id,
                    score=Decimal("58"),
                    score_label="Moderate",
                    institutional_score=Decimal("12"),
                    insider_score=Decimal("4"),
                    political_score=Decimal("0"),
                    activist_score=Decimal("0"),
                    buyback_score=Decimal("0"),
                    freshness_score=Decimal("9"),
                    confidence_score=Decimal("8"),
                    breakdown_json={
                        "institutional": "+12 due to mixed institutional behavior",
                        "insider": "+4 neutral insider activity",
                        "negative": "-18 from reduced fund exposure",
                    },
                ),
            ]
        )

        # -----------------------------
        # AI insights
        # -----------------------------
        db.add_all(
            [
                AIInsight(
                    company_id=nvda.id,
                    summary="NVDA shows a very strong MoneySignal profile driven by institutional accumulation and a recent insider purchase.",
                    why_it_matters="The strongest signal is that a major fund increased exposure while insider activity is also positive.",
                    watch_next="Watch whether additional funds report increased NVDA exposure in the next 13F cycle.",
                    limitations="This is a research signal, not financial advice.",
                    model_name="demo-ai-summary-v1",
                ),
                AIInsight(
                    company_id=googl.id,
                    summary="GOOGL shows strong smart-money interest after a high-conviction fund opened a new position.",
                    why_it_matters="A new position from a concentrated fund can signal stronger institutional attention.",
                    watch_next="Watch whether other funds also increase GOOGL exposure.",
                    limitations="This is a research signal, not financial advice.",
                    model_name="demo-ai-summary-v1",
                ),
                AIInsight(
                    company_id=msft.id,
                    summary="MSFT has a strong but stable signal profile with steady institutional holding.",
                    why_it_matters="The signal is positive but less aggressive because the fund maintained rather than increased exposure.",
                    watch_next="Watch whether future 13F filings show accumulation or reduction.",
                    limitations="This is a research signal, not financial advice.",
                    model_name="demo-ai-summary-v1",
                ),
                AIInsight(
                    company_id=tsla.id,
                    summary="TSLA has a mixed signal profile because a fund reduced exposure.",
                    why_it_matters="Institutional selling pressure may reduce the overall MoneySignal Score unless offset by other positive signals.",
                    watch_next="Watch for future filings, insider activity, or stronger accumulation signals.",
                    limitations="This is a research signal, not financial advice.",
                    model_name="demo-ai-summary-v1",
                ),
            ]
        )

        # -----------------------------
        # Watchlist and alerts
        # -----------------------------
        demo_user_id = "demo-user"

        db.add_all(
            [
                Watchlist(user_id=demo_user_id, company_id=nvda.id),
                Watchlist(user_id=demo_user_id, company_id=googl.id),
                Watchlist(user_id=demo_user_id, company_id=msft.id),
                Alert(
                    user_id=demo_user_id,
                    company_id=nvda.id,
                    signal_id=nvda_signal_1.id,
                    title="NVDA received a strong institutional accumulation signal",
                    message="Tiger Global increased its NVDA position, contributing positively to the MoneySignal Score.",
                    status="unread",
                    alert_type="signal",
                ),
                Alert(
                    user_id=demo_user_id,
                    company_id=googl.id,
                    signal_id=googl_signal_1.id,
                    title="GOOGL received a high-conviction fund signal",
                    message="Pershing Square opened a new GOOGL position with meaningful portfolio weight.",
                    status="unread",
                    alert_type="signal",
                ),
                Alert(
                    user_id=demo_user_id,
                    company_id=tsla.id,
                    signal_id=tsla_signal.id,
                    title="TSLA shows institutional selling pressure",
                    message="Pershing Square reduced TSLA exposure, creating a bearish signal.",
                    status="unread",
                    alert_type="signal",
                ),
            ]
        )

        db.commit()
        print("Full MoneySignal demo database seeded successfully.")

    except Exception as error:
        db.rollback()
        print(f"Seed failed: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()