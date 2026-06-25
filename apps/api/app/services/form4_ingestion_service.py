from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.models import Company, Insider, InsiderTrade, ProcessedFiling, Signal
from app.services.form4_parser import parse_form4_xml
from app.services.scoring_service import recalculate_score_by_ticker
from app.services.sec_client import get_filing_document


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


def _relationship_label(owner: dict[str, Any]) -> str:
    labels = []

    if owner.get("isDirector"):
        labels.append("Director")
    if owner.get("isOfficer"):
        labels.append("Officer")
    if owner.get("isTenPercentOwner"):
        labels.append("10% Owner")

    return ", ".join(labels) if labels else "Insider"


def _get_or_create_insider(
    db: Session,
    company: Company,
    owner: dict[str, Any],
) -> Insider:
    owner_name = owner.get("ownerName") or "Unknown Insider"
    owner_cik = owner.get("ownerCik")

    query = db.query(Insider).filter(Insider.company_id == company.id)

    if owner_cik:
        insider = query.filter(Insider.insider_cik == owner_cik).first()
    else:
        insider = query.filter(Insider.name == owner_name).first()

    if insider:
        insider.name = owner_name
        insider.title = owner.get("officerTitle")
        insider.relationship_to_company = _relationship_label(owner)
        insider.is_director = bool(owner.get("isDirector"))
        insider.is_officer = bool(owner.get("isOfficer"))
        insider.is_ten_percent_owner = bool(owner.get("isTenPercentOwner"))
        return insider

    insider = Insider(
        company_id=company.id,
        name=owner_name,
        title=owner.get("officerTitle"),
        relationship_to_company=_relationship_label(owner),
        insider_cik=owner_cik,
        is_director=bool(owner.get("isDirector")),
        is_officer=bool(owner.get("isOfficer")),
        is_ten_percent_owner=bool(owner.get("isTenPercentOwner")),
    )

    db.add(insider)
    db.flush()

    return insider


def _create_signal_for_trade(
    db: Session,
    company: Company,
    insider: Insider,
    trade: InsiderTrade,
) -> Signal:
    trade_value = float(trade.total_value or 0)

    if trade.transaction_code == "P":
        direction = "bullish"
        signal_type = "Insider Buy"
        score_impact = min(20, 8 + trade_value / 1_000_000)
        title = f"{insider.name} bought {company.ticker} shares"
        explanation = (
            f"{insider.name} reported an insider purchase worth "
            f"${trade_value:,.0f}."
        )
    elif trade.transaction_code == "S":
        direction = "bearish"
        signal_type = "Insider Sale"
        score_impact = -min(12, 4 + trade_value / 2_000_000)
        title = f"{insider.name} sold {company.ticker} shares"
        explanation = (
            f"{insider.name} reported an insider sale worth "
            f"${trade_value:,.0f}."
        )
    else:
        direction = "neutral"
        signal_type = "Insider Activity"
        score_impact = 0
        title = f"{insider.name} reported insider activity"
        explanation = (
            f"{insider.name} reported Form 4 activity with transaction code "
            f"{trade.transaction_code or 'unknown'}."
        )

    confidence = 75
    if insider.is_officer or insider.is_director:
        confidence = 85

    signal = Signal(
        company_id=company.id,
        signal_type=signal_type,
        source_type="INSIDER_TRADE",
        source_id=trade.id,
        source_name=insider.name,
        direction=direction,
        strength=Decimal(str(abs(score_impact) * 4 if score_impact else 35)),
        confidence=Decimal(str(confidence)),
        score_impact=Decimal(str(score_impact)),
        title=title,
        explanation=explanation,
        detected_at=datetime.utcnow(),
    )

    db.add(signal)
    db.flush()

    return signal


def ingest_form4_filing(
    db: Session,
    company: Company,
    filing: dict[str, Any],
) -> dict[str, Any]:
    accession_number = filing["accessionNumber"]
    filing_url = filing["filingUrl"]

    existing = (
        db.query(ProcessedFiling)
        .filter(
            (ProcessedFiling.accession_number == accession_number)
            | (ProcessedFiling.filing_url == filing_url)
        )
        .first()
    )

    if existing and existing.processing_status == "processed":
        return {
            "status": "skipped",
            "reason": "already_processed",
            "accessionNumber": accession_number,
            "recordsCreated": 0,
        }

    xml_text = get_filing_document(filing_url)
    parsed = parse_form4_xml(xml_text, filing_url=filing_url)

    owner = parsed["reportingOwner"]
    insider = _get_or_create_insider(db, company, owner)

    records_created = 0
    created_trade_ids = []

    for transaction in parsed["transactions"]:
        transaction_date = _parse_date(transaction.get("transactionDate"))

        if transaction_date is None:
            continue

        trade = InsiderTrade(
            company_id=company.id,
            insider_id=insider.id,
            transaction_date=transaction_date,
            filing_date=_parse_date(filing.get("filingDate")),
            transaction_type=transaction.get("transactionType") or "OTHER",
            transaction_code=transaction.get("transactionCode"),
            shares=_decimal(transaction.get("shares")),
            price_per_share=_decimal(transaction.get("pricePerShare")),
            total_value=_decimal(transaction.get("totalValue")),
            shares_owned_after=_decimal(transaction.get("sharesOwnedAfter")),
            ownership_type=transaction.get("ownershipType"),
            derivative_transaction=bool(transaction.get("derivativeTransaction")),
            accession_number=accession_number,
            sec_filing_url=filing_url,
        )

        db.add(trade)
        db.flush()

        _create_signal_for_trade(db, company, insider, trade)

        records_created += 1
        created_trade_ids.append(trade.id)

    processed = existing or ProcessedFiling(
        source_type="SEC_FORM_4",
        form_type=filing.get("formType"),
        accession_number=accession_number,
        filing_url=filing_url,
        ticker=company.ticker,
        filing_date=_parse_date(filing.get("filingDate")),
    )

    processed.processing_status = "processed"
    processed.records_created = records_created
    processed.error_message = None
    processed.processed_at = datetime.utcnow()

    db.add(processed)

    score = recalculate_score_by_ticker(db, company.ticker)

    return {
        "status": "processed",
        "accessionNumber": accession_number,
        "recordsCreated": records_created,
        "createdTradeIds": created_trade_ids,
        "score": score,
        "parsed": parsed,
    }