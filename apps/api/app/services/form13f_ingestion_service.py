from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.models import Company, Fund, FundFiling, FundHolding, ProcessedFiling, Signal
from app.services.form13f_parser import parse_13f_information_table
from app.services.scoring_service import recalculate_score_by_ticker
from app.services.sec_client import (
    get_13f_information_table_document,
    get_company_submissions,
)


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None

    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _decimal(value: float | int | None) -> Decimal | None:
    if value is None:
        return None

    return Decimal(str(value))


def _quarter_from_date(value: date | None) -> str | None:
    if value is None:
        return None

    quarter = ((value.month - 1) // 3) + 1
    return f"{value.year}-Q{quarter}"


def _normalize_cusip(value: str | None) -> str | None:
    if not value:
        return None

    return value.strip().upper()


def _get_or_create_fund(db: Session, cik: str) -> Fund:
    normalized_cik = str(cik).lstrip("0") or str(cik)

    fund = db.query(Fund).filter(Fund.cik == normalized_cik).first()

    if fund:
        return fund

    submissions = get_company_submissions(cik)
    fund_name = submissions.get("name") or f"Fund {normalized_cik}"

    fund = Fund(
        name=fund_name,
        cik=normalized_cik,
        fund_type="13F Institution",
    )

    db.add(fund)
    db.flush()

    return fund


def _find_company_for_holding(db: Session, holding: dict[str, Any]) -> Company | None:
    cusip = _normalize_cusip(holding.get("cusip"))

    if cusip:
        company = db.query(Company).filter(Company.cusip == cusip).first()
        if company:
            return company

    issuer_name = (holding.get("issuerName") or "").lower()

    # Fallback matching for tracked companies when CUSIP is missing.
    # Keep this simple for now.
    companies = db.query(Company).all()

    for company in companies:
        company_name = company.name.lower()
        ticker = company.ticker.lower()

        if ticker in issuer_name:
            return company

        if company_name.split(" ")[0] in issuer_name:
            return company

    return None


def _get_previous_holding(
    db: Session,
    fund_id: int,
    company_id: int,
    current_period_end: date | None,
) -> FundHolding | None:
    query = (
        db.query(FundHolding)
        .join(FundFiling, FundHolding.filing_id == FundFiling.id)
        .filter(
            FundHolding.fund_id == fund_id,
            FundHolding.company_id == company_id,
        )
    )

    if current_period_end:
        query = query.filter(FundFiling.period_end_date < current_period_end)

    return (
        query.order_by(FundFiling.period_end_date.desc())
        .first()
    )


def _position_status(previous_shares: Decimal | None, shares: Decimal | None) -> str:
    current = shares or Decimal("0")
    previous = previous_shares or Decimal("0")

    if previous == 0 and current > 0:
        return "NEW"

    if current > previous:
        return "INCREASED"

    if current < previous:
        return "REDUCED"

    return "UNCHANGED"


def _create_signal_for_holding(
    db: Session,
    company: Company,
    fund: Fund,
    holding: FundHolding,
) -> Signal | None:
    if holding.position_status == "UNCHANGED":
        return None

    market_value = float(holding.market_value or 0)
    share_change = float(holding.share_change or 0)

    if holding.position_status in {"NEW", "INCREASED"}:
        direction = "bullish"
        signal_type = "Institutional Accumulation"
        score_impact = min(18, 6 + market_value / 1_000_000_000)
        title = f"{fund.name} increased {company.ticker} exposure"
        explanation = (
            f"{fund.name} reported a {holding.position_status.lower()} position "
            f"in {company.ticker}, with market value around ${market_value:,.0f}."
        )
    elif holding.position_status == "REDUCED":
        direction = "bearish"
        signal_type = "Institutional Reduction"
        score_impact = -min(12, 4 + abs(share_change) / 10_000_000)
        title = f"{fund.name} reduced {company.ticker} exposure"
        explanation = (
            f"{fund.name} reported reduced holdings in {company.ticker}, "
            f"with share change of {share_change:,.0f}."
        )
    else:
        direction = "neutral"
        signal_type = "Institutional Holding"
        score_impact = 0
        title = f"{fund.name} reported {company.ticker} holdings"
        explanation = f"{fund.name} reported 13F holdings for {company.ticker}."

    signal = Signal(
        company_id=company.id,
        signal_type=signal_type,
        source_type="FUND_HOLDING",
        source_id=holding.id,
        source_name=fund.name,
        direction=direction,
        strength=Decimal(str(abs(score_impact) * 4 if score_impact else 35)),
        confidence=Decimal("80"),
        score_impact=Decimal(str(score_impact)),
        title=title,
        explanation=explanation,
        detected_at=datetime.utcnow(),
    )

    db.add(signal)
    db.flush()

    return signal


def ingest_13f_filing(
    db: Session,
    cik: str,
    filing: dict[str, Any],
) -> dict[str, Any]:
    accession_number = filing["accessionNumber"]

    existing_processed = (
        db.query(ProcessedFiling)
        .filter(ProcessedFiling.accession_number == accession_number)
        .first()
    )

    if existing_processed and existing_processed.processing_status == "processed":
        return {
            "status": "skipped",
            "reason": "already_processed",
            "accessionNumber": accession_number,
            "recordsCreated": 0,
            "companiesMatched": 0,
        }

    fund = _get_or_create_fund(db, cik)

    information_table_url, xml_text = get_13f_information_table_document(filing)
    parsed = parse_13f_information_table(
        xml_text,
        filing_url=information_table_url,
    )

    filing_date = _parse_date(filing.get("filingDate"))
    period_end_date = _parse_date(filing.get("reportDate"))
    quarter = _quarter_from_date(period_end_date)

    fund_filing = (
        db.query(FundFiling)
        .filter(FundFiling.accession_number == accession_number)
        .first()
    )

    if not fund_filing:
        fund_filing = FundFiling(
            fund_id=fund.id,
            form_type=filing.get("formType") or "13F-HR",
            filing_date=filing_date or datetime.utcnow().date(),
            period_end_date=period_end_date,
            accession_number=accession_number,
            filing_url=information_table_url,
        )

        db.add(fund_filing)
        db.flush()

    total_value = Decimal(str(parsed.get("totalValueUsd") or 0))

    records_created = 0
    companies_matched = 0
    companies_unmatched = 0
    impacted_tickers: set[str] = set()
    created_holding_ids = []

    for raw_holding in parsed["holdings"]:
        company = _find_company_for_holding(db, raw_holding)

        if not company:
            companies_unmatched += 1
            continue

        companies_matched += 1

        shares = _decimal(raw_holding.get("shares"))
        market_value = _decimal(raw_holding.get("valueUsd"))

        previous = _get_previous_holding(
            db,
            fund.id,
            company.id,
            period_end_date,
        )

        previous_shares = previous.shares if previous else None

        share_change = None
        change_percent = None

        if shares is not None:
            previous_value = previous_shares or Decimal("0")
            share_change = shares - previous_value

            if previous_value > 0:
                change_percent = (share_change / previous_value) * Decimal("100")

        portfolio_weight = None

        if market_value is not None and total_value > 0:
            portfolio_weight = (market_value / total_value) * Decimal("100")

        holding = FundHolding(
            fund_id=fund.id,
            company_id=company.id,
            filing_id=fund_filing.id,
            quarter=quarter,
            shares=shares,
            market_value=market_value,
            portfolio_weight=portfolio_weight,
            previous_shares=previous_shares,
            share_change=share_change,
            change_percent=change_percent,
            position_status=_position_status(previous_shares, shares),
        )

        db.add(holding)
        db.flush()

        _create_signal_for_holding(db, company, fund, holding)

        impacted_tickers.add(company.ticker)
        created_holding_ids.append(holding.id)
        records_created += 1

    processed = existing_processed or ProcessedFiling(
        source_type="SEC_13F",
        form_type=filing.get("formType") or "13F-HR",
        accession_number=accession_number,
        filing_url=information_table_url,
        ticker=None,
        filing_date=filing_date,
    )

    processed.processing_status = "processed"
    processed.records_created = records_created
    processed.error_message = None
    processed.processed_at = datetime.utcnow()

    db.add(processed)

    scores = []

    for ticker in sorted(impacted_tickers):
        scores.append(recalculate_score_by_ticker(db, ticker))

    return {
        "status": "processed",
        "fund": fund.name,
        "fundCik": fund.cik,
        "accessionNumber": accession_number,
        "holdingCount": parsed["holdingCount"],
        "companiesMatched": companies_matched,
        "companiesUnmatched": companies_unmatched,
        "recordsCreated": records_created,
        "createdHoldingIds": created_holding_ids,
        "impactedTickers": sorted(impacted_tickers),
        "scores": scores,
    }