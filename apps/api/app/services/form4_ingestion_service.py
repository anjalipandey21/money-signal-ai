from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.models import Company, Insider, InsiderTrade, ProcessedFiling, Signal
from app.services.form4_parser import Form4ParserError, parse_form4_xml
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


def _skip_reason(transaction: dict[str, Any], transaction_date: date | None) -> str | None:
    if transaction_date is None:
        return "missing_transaction_date"

    if not transaction.get("transactionCode"):
        return "missing_transaction_code"

    shares = transaction.get("shares")
    price = transaction.get("pricePerShare")
    total_value = transaction.get("totalValue")

    if shares is None:
        return "missing_shares"

    if _decimal(shares) is None or _decimal(shares) <= 0:
        return "zero_or_negative_shares"

    if price is None:
        return "missing_price"

    if _decimal(price) is None or _decimal(price) <= 0:
        return "zero_or_negative_price"

    if total_value is None:
        return "zero_or_negative_value"

    if _decimal(total_value) is None or _decimal(total_value) <= 0:
        return "zero_or_negative_value"

    return None


def _is_missing_price_skip(reason: str | None) -> bool:
    return reason == "missing_price"


def _is_zero_value_skip(reason: str | None) -> bool:
    return reason in {
        "zero_or_negative_price",
        "zero_or_negative_shares",
        "zero_or_negative_value",
    }


def _trade_already_exists(
    db: Session,
    company: Company,
    insider: Insider,
    accession_number: str,
    transaction_date: date,
    transaction: dict[str, Any],
) -> bool:
    shares = _decimal(transaction.get("shares"))
    price = _decimal(transaction.get("pricePerShare"))

    return (
        db.query(InsiderTrade)
        .filter(InsiderTrade.company_id == company.id)
        .filter(InsiderTrade.insider_id == insider.id)
        .filter(InsiderTrade.accession_number == accession_number)
        .filter(InsiderTrade.transaction_date == transaction_date)
        .filter(InsiderTrade.transaction_code == transaction.get("transactionCode"))
        .filter(InsiderTrade.shares == shares)
        .filter(InsiderTrade.price_per_share == price)
        .filter(
            InsiderTrade.derivative_transaction
            == bool(transaction.get("derivativeTransaction"))
        )
        .first()
        is not None
    )


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
            "duplicateSkipped": 0,
            "invalidSkipped": 0,
            "missingPriceSkipped": 0,
            "zeroValueSkipped": 0,
            "parserWarningCount": 0,
            "skipReasons": {},
        }

    xml_text = get_filing_document(filing_url)
    lowered_xml = xml_text[:2000].lower()

    if (
        not xml_text.lstrip().startswith(("<?xml", "<ownershipDocument", "<XML"))
        and "ownershipdocument" not in lowered_xml
    ):
        raise Form4ParserError("SEC filing document did not contain ownershipDocument")

    parsed = parse_form4_xml(xml_text, filing_url=filing_url)

    owner = parsed["reportingOwner"]
    insider = _get_or_create_insider(db, company, owner)

    records_created = 0
    created_trade_ids = []
    duplicate_skipped = 0
    invalid_skipped = 0
    missing_price_skipped = 0
    zero_value_skipped = 0
    skip_reasons: dict[str, int] = {}

    for transaction in parsed["transactions"]:
        transaction_date = _parse_date(transaction.get("transactionDate"))
        skip_reason = _skip_reason(transaction, transaction_date)

        if skip_reason:
            invalid_skipped += 1
            skip_reasons[skip_reason] = skip_reasons.get(skip_reason, 0) + 1

            if _is_missing_price_skip(skip_reason):
                missing_price_skipped += 1

            if _is_zero_value_skip(skip_reason):
                zero_value_skipped += 1

            continue

        if _trade_already_exists(
            db,
            company,
            insider,
            accession_number,
            transaction_date,
            transaction,
        ):
            duplicate_skipped += 1
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
    processed.error_message = (
        None
        if records_created
        else "No valid new Form 4 trades found."
    )
    processed.processed_at = datetime.utcnow()

    db.add(processed)

    score = recalculate_score_by_ticker(db, company.ticker)

    return {
        "status": "processed",
        "accessionNumber": accession_number,
        "recordsCreated": records_created,
        "duplicateSkipped": duplicate_skipped,
        "invalidSkipped": invalid_skipped,
        "missingPriceSkipped": missing_price_skipped,
        "zeroValueSkipped": zero_value_skipped,
        "parserWarningCount": parsed.get("validationWarningCount", 0),
        "skipReasons": skip_reasons,
        "createdTradeIds": created_trade_ids,
        "score": score,
        "parsed": parsed,
        "message": "No valid new Form 4 trades found."
        if not records_created
        else None,
    }
