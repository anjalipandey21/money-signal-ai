from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models import Company, Fund, ScrapeHistory
from app.services.form13f_ingestion_service import ingest_13f_filing
from app.services.form4_ingestion_service import ingest_form4_filing
from app.services.form4_parser import Form4ParserError
from app.services.market_data_service import refresh_market_snapshot
from app.services.scoring_service import recalculate_all_scores
from app.services.sec_client import (
    SECClientError,
    get_recent_13f_filings,
    get_recent_form4_filings,
)

CORE_DEMO_TICKERS = {"AAPL", "MSFT", "GOOGL", "NVDA", "META", "TSLA"}
MARKET_ALLOWED_EXCHANGES = {"", "UNKNOWN", "NYSE", "NASDAQ", "AMEX"}
MARKET_BLOCKED_EXCHANGE_TOKENS = {
    "OTC",
    "PINK",
    "GREY",
    "OTCMKTS",
    "OTCQB",
    "OTCQX",
}
MARKET_MAX_CONSECUTIVE_FAILURES = 10
MARKET_SAMPLE_LIMIT = 20


def _new_pipeline_history() -> ScrapeHistory:
    return ScrapeHistory(
        ticker="ALL",
        source_type="FULL_PIPELINE",
        status="started",
        started_at=datetime.utcnow(),
    )


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _empty_stage(name: str, message: str | None = None) -> dict[str, Any]:
    started_at = datetime.utcnow()

    return {
        "name": name,
        "stage": name,
        "status": "success",
        "startedAt": _iso(started_at),
        "completedAt": None,
        "durationSeconds": None,
        "attempted": 0,
        "processed": 0,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "failed": 0,
        "recordsCreated": 0,
        "message": message,
        "warnings": [],
        "errors": [],
        "warningCount": 0,
        "errorCount": 0,
        "skippedTickers": [],
        "failedTickers": [],
        "duplicateSkipped": 0,
        "invalidSkipped": 0,
        "missingPriceSkipped": 0,
        "zeroValueSkipped": 0,
        "parserWarningCount": 0,
        "filingsCreated": 0,
        "filingsDuplicateSkipped": 0,
        "holdingsCreated": 0,
        "holdingsUpdated": 0,
    }


def _append_limited(items: list[dict[str, Any]], item: dict[str, Any]) -> None:
    if len(items) < 25:
        items.append(item)


def _add_stage_warning(
    stage: dict[str, Any],
    warnings: list[dict[str, Any]],
    message: str,
    **context: Any,
) -> None:
    item = {"stage": stage["name"], "message": message, **context}
    stage["warningCount"] += 1
    _append_limited(stage["warnings"], item)
    _append_limited(warnings, item)


def _add_stage_error(
    stage: dict[str, Any],
    errors: list[dict[str, Any]],
    message: str,
    **context: Any,
) -> None:
    item = {"stage": stage["name"], "message": message, **context}
    stage["errorCount"] += 1
    _append_limited(stage["errors"], item)
    _append_limited(errors, item)


def _finish_stage(stage: dict[str, Any]) -> None:
    completed_at = datetime.utcnow()
    started_at = datetime.fromisoformat(stage["startedAt"])

    stage["completedAt"] = _iso(completed_at)
    stage["durationSeconds"] = round(
        (completed_at - started_at).total_seconds(),
        2,
    )

    if stage["failed"] > 0:
        has_partial_success = (
            stage["processed"] > 0
            or stage["created"] > 0
            or stage["updated"] > 0
            or stage["skipped"] > 0
        )
        stage["status"] = "partial" if has_partial_success else "failed"
    elif stage["attempted"] > 0 and not (
        stage["processed"] or stage["created"] or stage["updated"]
    ):
        stage["status"] = "partial"

        if not stage.get("message"):
            stage["message"] = f"No new records found for {stage['name']}."
    elif stage["skipped"] > 0 and not (
        stage["processed"] or stage["created"] or stage["updated"]
    ):
        stage["status"] = "skipped"
    else:
        stage["status"] = "success"


def _stage_count(stage: dict[str, Any], key: str) -> int:
    value = stage.get(key)

    return int(value or 0)


def _common_stock_skip_reason(company: Company) -> str | None:
    symbol = (company.ticker or "").strip().upper()

    if symbol in CORE_DEMO_TICKERS:
        return None

    if not symbol:
        return "Empty ticker skipped."

    if len(symbol) > 5:
        return "Ticker length is outside the supported common-stock range."

    if "/" in symbol or "^" in symbol:
        return "Ticker format is not supported."

    if symbol.endswith((".W", ".WS", ".U")):
        return "Warrant or unit ticker skipped."

    if symbol.endswith(("WS", "WT")):
        return "Warrant-like ticker skipped."

    if len(symbol) > 1 and symbol.endswith(("W", "U", "R")):
        return "Warrant, unit, or right-like ticker skipped."

    exchange = (company.exchange or "").strip().upper()

    if any(token in exchange for token in MARKET_BLOCKED_EXCHANGE_TOKENS):
        return "OTC or pink-sheet ticker skipped."

    if exchange and exchange not in MARKET_ALLOWED_EXCHANGES:
        return "Exchange is outside the supported common-stock list."

    return None


def _stage_skip_message(reason: str, stage_label: str) -> str:
    normalized = reason.rstrip(".")

    if "skipped" in normalized.lower():
        return f"{normalized} by {stage_label}."

    return f"{normalized}; skipped by {stage_label}."


def _market_skip_reason(company: Company) -> str | None:
    reason = _common_stock_skip_reason(company)

    return _stage_skip_message(reason, "market refresh") if reason else None


def is_market_refresh_eligible(company: Company) -> bool:
    return _market_skip_reason(company) is None


def _append_ticker_sample(stage: dict[str, Any], key: str, ticker: str | None) -> None:
    if ticker and len(stage[key]) < MARKET_SAMPLE_LIMIT:
        stage[key].append(ticker)


def _market_refresh_candidates(
    companies: list[Company],
    market_stage: dict[str, Any],
    warnings: list[dict[str, Any]],
    market_limit: int,
) -> list[Company]:
    candidates: list[Company] = []
    normalized_limit = max(0, market_limit)
    ordered_companies = sorted(
        companies,
        key=lambda company: (
            0 if (company.ticker or "").strip().upper() in CORE_DEMO_TICKERS else 1,
            (company.ticker or "").strip().upper(),
        ),
    )

    for company in ordered_companies:
        symbol = (company.ticker or "").strip().upper()
        skip_reason = _market_skip_reason(company)

        if skip_reason:
            market_stage["skipped"] += 1
            _append_ticker_sample(market_stage, "skippedTickers", symbol)
            _add_stage_warning(
                market_stage,
                warnings,
                skip_reason,
                ticker=company.ticker,
                exchange=company.exchange,
            )
            continue

        if symbol not in CORE_DEMO_TICKERS and len(candidates) >= normalized_limit:
            market_stage["skipped"] += 1
            _append_ticker_sample(market_stage, "skippedTickers", symbol)
            continue

        candidates.append(company)

    if len(candidates) < len(companies):
        market_stage["message"] = (
            f"Market refresh capped at {len(candidates)} ticker(s) "
            f"by market_limit={normalized_limit}; unsupported symbols were skipped."
        )

    return candidates


def _has_valid_cik(company: Company) -> bool:
    return bool(company.cik and any(char.isdigit() for char in str(company.cik)))


def is_form4_eligible(company: Company) -> bool:
    return _has_valid_cik(company) and _common_stock_skip_reason(company) is None


def get_company_universe_stats(companies: list[Company]) -> dict[str, Any]:
    by_exchange: dict[str, int] = {}

    for company in companies:
        exchange = (company.exchange or "Unknown").strip() or "Unknown"
        by_exchange[exchange] = by_exchange.get(exchange, 0) + 1

    companies_with_cik = sum(1 for company in companies if _has_valid_cik(company))
    eligible_form4 = sum(1 for company in companies if is_form4_eligible(company))
    eligible_market = sum(
        1 for company in companies if is_market_refresh_eligible(company)
    )

    return {
        "totalCompanies": len(companies),
        "companiesWithCik": companies_with_cik,
        "companiesWithoutCik": len(companies) - companies_with_cik,
        "eligibleForForm4": eligible_form4,
        "eligibleForMarketRefresh": eligible_market,
        "byExchange": [
            {"exchange": exchange, "count": count}
            for exchange, count in sorted(
                by_exchange.items(),
                key=lambda item: (-item[1], item[0]),
            )
        ],
    }


def _form4_candidates(
    companies: list[Company],
    form4_stage: dict[str, Any],
    warnings: list[dict[str, Any]],
    form4_limit: int,
) -> list[Company]:
    candidates: list[Company] = []
    normalized_limit = max(0, form4_limit)
    ordered_companies = sorted(
        companies,
        key=lambda company: (
            0 if (company.ticker or "").strip().upper() in CORE_DEMO_TICKERS else 1,
            (company.ticker or "").strip().upper(),
        ),
    )

    for company in ordered_companies:
        symbol = (company.ticker or "").strip().upper()

        if not _has_valid_cik(company):
            form4_stage["skipped"] += 1
            _append_ticker_sample(form4_stage, "skippedTickers", symbol)
            _add_stage_warning(
                form4_stage,
                warnings,
                "Missing or invalid SEC CIK; skipped Form 4 ingestion.",
                ticker=company.ticker,
            )
            continue

        skip_reason = _common_stock_skip_reason(company)

        if skip_reason:
            form4_stage["skipped"] += 1
            _append_ticker_sample(form4_stage, "skippedTickers", symbol)
            _add_stage_warning(
                form4_stage,
                warnings,
                _stage_skip_message(skip_reason, "Form 4 ingestion"),
                ticker=company.ticker,
                exchange=company.exchange,
            )
            continue

        if len(candidates) >= normalized_limit:
            form4_stage["skipped"] += 1
            _append_ticker_sample(form4_stage, "skippedTickers", symbol)
            continue

        candidates.append(company)

    if len(candidates) < len(companies):
        form4_stage["message"] = (
            f"Form 4 ingestion capped at {len(candidates)} eligible company "
            f"attempt(s) by form4_limit={normalized_limit}; remaining "
            "companies were skipped."
        )

    return candidates


def _short_error(error: Exception | str, max_length: int = 180) -> str:
    message = str(error).replace("\n", " ").replace("\r", " ").strip()

    if len(message) <= max_length:
        return message

    return f"{message[:max_length].rstrip()}..."


def _concise_form4_document_error(error: Exception) -> str:
    message = str(error).lower()

    if "html" in message:
        return "SEC returned HTML or non-XML content instead of Form 4 ownership XML."

    if "ownershipdocument" in message:
        return "Could not find ownershipDocument in SEC response."

    if "invalid form 4 xml" in message:
        return "Invalid Form 4 XML document."

    return _short_error(error)


def _is_form4_document_warning(error: Exception) -> bool:
    if isinstance(error, (Form4ParserError, SECClientError)):
        return True

    message = str(error).lower()

    return (
        "ownershipdocument" in message
        or "html instead of xml" in message
        or "invalid form 4 xml" in message
    )


def run_full_ingestion_pipeline(
    db: Session,
    form4_limit: int = 5,
    thirteen_f_limit: int = 3,
    refresh_market: bool = True,
    market_limit: int = 25,
) -> dict[str, Any]:
    started_at = datetime.utcnow()
    history = _new_pipeline_history()
    warnings: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []

    db.add(history)
    db.commit()
    db.refresh(history)

    market_stage = _empty_stage("market refresh")
    form4_stage = _empty_stage("Form 4 ingestion")
    thirteen_f_stage = _empty_stage("13F ingestion")
    signal_stage = _empty_stage(
        "signal generation",
        "Signals are generated during Form 4 and 13F ingestion in this pipeline.",
    )
    scoring_stage = _empty_stage("score recalculation")
    history_stage = _empty_stage("scrape history write")
    universe_stats: dict[str, Any] = {
        "totalCompanies": 0,
        "companiesWithCik": 0,
        "companiesWithoutCik": 0,
        "eligibleForForm4": 0,
        "eligibleForMarketRefresh": 0,
        "byExchange": [],
    }
    market_candidates: list[Company] = []
    form4_candidates: list[Company] = []

    try:
        companies = db.query(Company).order_by(Company.ticker.asc()).all()
        universe_stats = get_company_universe_stats(companies)

        if refresh_market:
            consecutive_failures = 0
            market_candidates = _market_refresh_candidates(
                companies,
                market_stage,
                warnings,
                market_limit,
            )

            for company in market_candidates:
                market_stage["attempted"] += 1

                try:
                    refresh_market_snapshot(db, company.ticker)
                    market_stage["processed"] += 1
                    market_stage["updated"] += 1
                    consecutive_failures = 0

                except Exception as error:
                    db.rollback()
                    market_stage["failed"] += 1
                    consecutive_failures += 1
                    _append_ticker_sample(
                        market_stage,
                        "failedTickers",
                        company.ticker,
                    )
                    _add_stage_warning(
                        market_stage,
                        warnings,
                        "Market provider did not return a usable quote.",
                        ticker=company.ticker,
                        error=str(error),
                    )

                    if consecutive_failures >= MARKET_MAX_CONSECUTIVE_FAILURES:
                        remaining = len(market_candidates) - market_stage["attempted"]
                        market_stage["skipped"] += remaining
                        market_stage["message"] = (
                            f"Market refresh stopped after "
                            f"{MARKET_MAX_CONSECUTIVE_FAILURES} consecutive "
                            "provider failures."
                        )
                        break

        else:
            market_stage["skipped"] = len(companies)
            market_stage["message"] = "Market refresh disabled for this run."

        _finish_stage(market_stage)

        form4_candidates = _form4_candidates(
            companies,
            form4_stage,
            warnings,
            form4_limit,
        )

        for company in form4_candidates:
            form4_stage["attempted"] += 1

            try:
                filings = get_recent_form4_filings(company.cik, limit=1)
                _ingest_form4_filings(
                    db,
                    company,
                    filings,
                    form4_stage,
                    warnings,
                    errors,
                )

            except Exception as error:
                db.rollback()
                form4_stage["failed"] += 1
                _append_ticker_sample(
                    form4_stage,
                    "failedTickers",
                    company.ticker,
                )

                if _is_form4_document_warning(error):
                    _add_stage_warning(
                        form4_stage,
                        warnings,
                        "Form 4 document was unavailable or not parseable.",
                        ticker=company.ticker,
                        error=_concise_form4_document_error(error),
                    )
                else:
                    _add_stage_error(
                        form4_stage,
                        errors,
                        "Form 4 ingestion failed for ticker.",
                        ticker=company.ticker,
                        error=_short_error(error),
                    )

        _finish_stage(form4_stage)

        funds = (
            db.query(Fund)
            .filter(Fund.cik.isnot(None))
            .order_by(Fund.name.asc())
            .all()
        )

        if not funds:
            thirteen_f_stage["message"] = "No tracked fund CIK list configured yet."
            thirteen_f_stage["skipped"] = 1
        else:
            for fund in funds:
                thirteen_f_stage["attempted"] += 1

                try:
                    filings = get_recent_13f_filings(
                        fund.cik,
                        limit=thirteen_f_limit,
                    )
                    _ingest_13f_filings(
                        db,
                        fund.cik,
                        filings,
                        thirteen_f_stage,
                        warnings,
                        errors,
                    )

                except Exception as error:
                    db.rollback()
                    thirteen_f_stage["failed"] += 1
                    _add_stage_error(
                        thirteen_f_stage,
                        errors,
                        "13F ingestion failed for fund.",
                        fund=fund.name,
                        cik=fund.cik,
                        error=str(error),
                    )

        _finish_stage(thirteen_f_stage)
        _finish_stage(signal_stage)

        try:
            scores = recalculate_all_scores(db)
            scoring_stage["attempted"] = len(companies)
            scoring_stage["processed"] = len(scores)

        except Exception as error:
            db.rollback()
            scoring_stage["failed"] = len(companies)
            _add_stage_error(
                scoring_stage,
                errors,
                "MoneySignal score recalculation failed.",
                error=str(error),
            )

        _finish_stage(scoring_stage)

        stages = [
            market_stage,
            form4_stage,
            thirteen_f_stage,
            signal_stage,
            scoring_stage,
            history_stage,
        ]
        failed_count = sum(_stage_count(stage, "failed") for stage in stages)
        skipped_count = sum(_stage_count(stage, "skipped") for stage in stages)
        records_created = sum(_stage_count(stage, "created") for stage in stages)
        processed_count = sum(_stage_count(stage, "processed") for stage in stages)
        completed_at = datetime.utcnow()
        pipeline_status = "success"

        if errors:
            pipeline_status = "partial"
        elif warnings:
            pipeline_status = "partial"

        history.status = (
            "processed"
            if pipeline_status == "success"
            else "processed_with_warnings"
            if warnings and not errors
            else "processed_with_errors"
        )
        history.filings_found = (
            market_stage["attempted"]
            + form4_stage["attempted"]
            + thirteen_f_stage["attempted"]
        )
        history.filings_processed = processed_count
        history.filings_skipped = skipped_count
        history.filings_failed = failed_count
        history.records_created = records_created
        history.error_message = _summarize_stage_errors(stages)
        history.completed_at = completed_at
        db.commit()
        history_stage["processed"] = 1
        history_stage["message"] = f"Scrape history row {history.id} updated."
        _finish_stage(history_stage)

        return {
            "success": not errors,
            "status": pipeline_status,
            "message": "Full ingestion pipeline completed with details.",
            "startedAt": _iso(started_at),
            "completedAt": _iso(completed_at),
            "durationSeconds": round((completed_at - started_at).total_seconds(), 2),
            "companiesFound": len(companies),
            "totalCompanies": universe_stats["totalCompanies"],
            "eligibleForm4Companies": universe_stats["eligibleForForm4"],
            "eligibleMarketCompanies": universe_stats["eligibleForMarketRefresh"],
            "form4LimitApplied": len(form4_candidates)
            < universe_stats["eligibleForForm4"],
            "marketLimitApplied": refresh_market
            and len(market_candidates) < universe_stats["eligibleForMarketRefresh"],
            "companyUniverse": universe_stats,
            "fundsFound": len(funds),
            "stages": stages,
            "totals": {
                "attempted": history.filings_found,
                "processed": history.filings_processed,
                "skipped": history.filings_skipped,
                "failed": failed_count,
                "created": records_created,
                "updated": sum(_stage_count(stage, "updated") for stage in stages),
                "recordsCreated": records_created,
                "warnings": sum(
                    _stage_count(stage, "warningCount") for stage in stages
                ),
                "errors": sum(_stage_count(stage, "errorCount") for stage in stages),
            },
            "warnings": warnings,
            "errors": errors,
        }

    except Exception as error:
        db.rollback()

        history.status = "failed"
        history.error_message = str(error)
        history.completed_at = datetime.utcnow()

        db.add(history)
        db.commit()

        return {
            "success": False,
            "status": "failed",
            "startedAt": _iso(started_at),
            "completedAt": _iso(history.completed_at),
            "durationSeconds": round(
                (history.completed_at - started_at).total_seconds(),
                2,
            )
            if history.completed_at
            else None,
            "totalCompanies": universe_stats["totalCompanies"],
            "eligibleForm4Companies": universe_stats["eligibleForForm4"],
            "eligibleMarketCompanies": universe_stats["eligibleForMarketRefresh"],
            "form4LimitApplied": len(form4_candidates)
            < universe_stats["eligibleForForm4"],
            "marketLimitApplied": refresh_market
            and len(market_candidates) < universe_stats["eligibleForMarketRefresh"],
            "companyUniverse": universe_stats,
            "stages": [
                market_stage,
                form4_stage,
                thirteen_f_stage,
                signal_stage,
                scoring_stage,
                history_stage,
            ],
            "totals": {
                "processed": 0,
                "created": 0,
                "updated": 0,
                "skipped": 0,
                "failed": 1,
                "recordsCreated": 0,
                "warnings": len(warnings),
                "errors": len(errors) + 1,
            },
            "warnings": warnings,
            "errors": [*errors, {"stage": "pipeline", "message": str(error)}],
            "error": str(error),
        }


def _ingest_form4_filings(
    db: Session,
    company: Company,
    filings: list[dict[str, Any]],
    stage: dict[str, Any],
    warnings: list[dict[str, Any]],
    errors: list[dict[str, Any]],
) -> int:
    records_created = 0

    if not filings:
        stage["skipped"] += 1
        _append_ticker_sample(stage, "skippedTickers", company.ticker)
        _add_stage_warning(
            stage,
            warnings,
            "No recent Form 4 filings found.",
            ticker=company.ticker,
        )
        return records_created

    for filing in filings:
        try:
            result = ingest_form4_filing(db, company, filing)

            if result.get("status") == "skipped":
                stage["skipped"] += 1
            else:
                stage["processed"] += 1
                created = int(result.get("recordsCreated") or 0)
                duplicate_skipped = int(result.get("duplicateSkipped") or 0)
                invalid_skipped = int(result.get("invalidSkipped") or 0)
                missing_price_skipped = int(
                    result.get("missingPriceSkipped") or 0
                )
                zero_value_skipped = int(result.get("zeroValueSkipped") or 0)
                parser_warning_count = int(
                    result.get("parserWarningCount") or 0
                )

                stage["created"] += created
                stage["recordsCreated"] += created
                stage["duplicateSkipped"] += duplicate_skipped
                stage["invalidSkipped"] += invalid_skipped
                stage["missingPriceSkipped"] += missing_price_skipped
                stage["zeroValueSkipped"] += zero_value_skipped
                stage["parserWarningCount"] += parser_warning_count
                stage["skipped"] += duplicate_skipped + invalid_skipped
                records_created += created

                if parser_warning_count:
                    _add_stage_warning(
                        stage,
                        warnings,
                        "Form 4 parser reported validation warnings.",
                        ticker=company.ticker,
                        parserWarningCount=parser_warning_count,
                    )

                if duplicate_skipped:
                    _add_stage_warning(
                        stage,
                        warnings,
                        "Duplicate Form 4 trade rows skipped.",
                        ticker=company.ticker,
                        duplicateSkipped=duplicate_skipped,
                    )

                if invalid_skipped:
                    _add_stage_warning(
                        stage,
                        warnings,
                        "Invalid or economically non-meaningful Form 4 trade rows skipped.",
                        ticker=company.ticker,
                        invalidSkipped=invalid_skipped,
                        skipReasons=result.get("skipReasons", {}),
                    )

        except Exception as error:
            db.rollback()
            stage["failed"] += 1
            _append_ticker_sample(stage, "failedTickers", company.ticker)
            item = {
                "stage": stage["name"],
                "message": "Form 4 document was unavailable or not parseable."
                if _is_form4_document_warning(error)
                else "Form 4 filing ingestion failed.",
                "ticker": company.ticker,
                "accessionNumber": filing.get("accessionNumber"),
                "filingUrl": filing.get("filingUrl"),
                "error": _concise_form4_document_error(error)
                if _is_form4_document_warning(error)
                else _short_error(error),
            }

            if _is_form4_document_warning(error):
                stage["warningCount"] += 1
                _append_limited(stage["warnings"], item)
                _append_limited(warnings, item)
            else:
                stage["errorCount"] += 1
                _append_limited(stage["errors"], item)
                _append_limited(errors, item)

    return records_created


def _ingest_13f_filings(
    db: Session,
    cik: str,
    filings: list[dict[str, Any]],
    stage: dict[str, Any],
    warnings: list[dict[str, Any]],
    errors: list[dict[str, Any]],
) -> int:
    records_created = 0

    for filing in filings:
        try:
            result = ingest_13f_filing(db, cik, filing)
            created = int(result.get("recordsCreated") or 0)
            filings_created = int(result.get("filingsCreated") or 0)
            filing_duplicates = int(
                result.get("filingsDuplicateSkipped") or 0
            )
            holdings_created = int(result.get("holdingsCreated") or created)
            holdings_updated = int(result.get("holdingsUpdated") or 0)
            duplicate_skipped = int(result.get("duplicateSkipped") or 0)
            invalid_skipped = int(result.get("invalidSkipped") or 0)
            parser_warning_count = int(
                result.get("parserWarningCount") or 0
            )

            if result.get("status") == "skipped":
                stage["skipped"] += 1
            else:
                stage["processed"] += 1
                stage["created"] += created
                stage["recordsCreated"] += created
                records_created += created

            stage["filingsCreated"] += filings_created
            stage["filingsDuplicateSkipped"] += filing_duplicates
            stage["holdingsCreated"] += holdings_created
            stage["holdingsUpdated"] += holdings_updated
            stage["duplicateSkipped"] += duplicate_skipped
            stage["invalidSkipped"] += invalid_skipped
            stage["parserWarningCount"] += parser_warning_count
            stage["skipped"] += duplicate_skipped + invalid_skipped

            if parser_warning_count:
                _add_stage_warning(
                    stage,
                    warnings,
                    "13F parser reported validation warnings.",
                    cik=cik,
                    accessionNumber=filing.get("accessionNumber"),
                    parserWarningCount=parser_warning_count,
                )

            if filing_duplicates:
                _add_stage_warning(
                    stage,
                    warnings,
                    "Duplicate 13F filing row reused.",
                    cik=cik,
                    accessionNumber=filing.get("accessionNumber"),
                    filingsDuplicateSkipped=filing_duplicates,
                )

            if duplicate_skipped:
                _add_stage_warning(
                    stage,
                    warnings,
                    "Duplicate 13F holdings skipped.",
                    cik=cik,
                    accessionNumber=filing.get("accessionNumber"),
                    duplicateSkipped=duplicate_skipped,
                )

            if invalid_skipped:
                _add_stage_warning(
                    stage,
                    warnings,
                    "Invalid or non-useful 13F holdings skipped.",
                    cik=cik,
                    accessionNumber=filing.get("accessionNumber"),
                    invalidSkipped=invalid_skipped,
                    skipReasons=result.get("skipReasons", {}),
                )

        except Exception as error:
            db.rollback()
            stage["failed"] += 1
            stage["errorCount"] += 1
            item = {
                "stage": stage["name"],
                "message": "13F filing ingestion failed.",
                "cik": cik,
                "accessionNumber": filing.get("accessionNumber"),
                "error": str(error),
            }
            _append_limited(stage["errors"], item)
            _append_limited(errors, item)

    return records_created


def _summarize_stage_errors(stages: list[dict[str, Any]]) -> str | None:
    messages = []

    for stage in stages:
        if not stage["errors"] and not stage.get("warnings"):
            continue

        if stage.get("errorCount"):
            messages.append(f"{stage['name']}: {stage['errorCount']} error(s)")

        if stage.get("warningCount"):
            messages.append(f"{stage['name']}: {stage['warningCount']} warning(s)")

    return "; ".join(messages) if messages else None
