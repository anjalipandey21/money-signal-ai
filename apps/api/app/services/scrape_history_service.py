from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models import ScrapeHistory

MAX_TEXT_LENGTH = 280
MAX_ISSUE_SAMPLE = 25


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _parse_datetime(value: str | datetime | None) -> datetime | None:
    if isinstance(value, datetime):
        return value

    if not value:
        return None

    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _safe_text(value: Any, max_length: int = MAX_TEXT_LENGTH) -> str | None:
    if value is None:
        return None

    text = str(value).replace("\n", " ").replace("\r", " ").strip()

    if len(text) <= max_length:
        return text

    return f"{text[:max_length].rstrip()}..."


def _safe_issue(issue: dict[str, Any]) -> dict[str, Any]:
    safe: dict[str, Any] = {}

    for key in (
        "stage",
        "message",
        "ticker",
        "fund",
        "cik",
        "accessionNumber",
        "exchange",
        "error",
    ):
        if key in issue and issue[key] is not None:
            safe[key] = _safe_text(issue[key])

    return safe


def _safe_stage(stage: dict[str, Any]) -> dict[str, Any]:
    safe: dict[str, Any] = {}

    for key in (
        "name",
        "stage",
        "status",
        "startedAt",
        "completedAt",
        "durationSeconds",
        "attempted",
        "processed",
        "created",
        "updated",
        "skipped",
        "failed",
        "recordsCreated",
        "duplicateSkipped",
        "invalidSkipped",
        "missingPriceSkipped",
        "zeroValueSkipped",
        "parserWarningCount",
        "filingsCreated",
        "filingsDuplicateSkipped",
        "holdingsCreated",
        "holdingsUpdated",
        "warningCount",
        "errorCount",
        "skippedTickers",
        "failedTickers",
        "skipReasons",
    ):
        if key in stage:
            safe[key] = stage[key]

    if stage.get("message"):
        safe["message"] = _safe_text(stage.get("message"))

    if stage.get("warnings"):
        safe["warnings"] = [
            _safe_issue(issue)
            for issue in stage.get("warnings", [])[:MAX_ISSUE_SAMPLE]
            if isinstance(issue, dict)
        ]

    if stage.get("errors"):
        safe["errors"] = [
            _safe_issue(issue)
            for issue in stage.get("errors", [])[:MAX_ISSUE_SAMPLE]
            if isinstance(issue, dict)
        ]

    return safe


def _history_status(status: str | None, success: bool | None = None) -> str:
    normalized = (status or "").strip().lower()

    if normalized in {"started", "running", "failed", "stale", "skipped"}:
        return normalized

    if normalized in {"success", "complete", "completed", "processed"}:
        return "completed"

    if normalized in {"partial", "processed_with_warnings", "warning"}:
        return "completed_with_warnings"

    if normalized == "processed_with_errors":
        return "failed" if success is False else "completed_with_warnings"

    if success is False:
        return "failed"

    return normalized or "completed"


def _count_issues(result: dict[str, Any], key: str) -> int:
    value = result.get(key)

    if isinstance(value, list):
        return len(value)

    totals = result.get("totals")

    if isinstance(totals, dict):
        count = totals.get(key)
        if isinstance(count, int):
            return count

    return 0


def _extract_error(result: dict[str, Any]) -> str | None:
    if result.get("error"):
        return _safe_text(result["error"])

    errors = result.get("errors")

    if isinstance(errors, list) and errors:
        first = errors[0]
        if isinstance(first, dict):
            message = first.get("error") or first.get("message")
            return _safe_text(message)

    return None


def build_history_details(
    result: dict[str, Any],
    *,
    run_id: str | None,
    trigger_source: str | None,
    triggered_by: str | None,
    form4_limit: int | None,
    thirteen_f_limit: int | None,
    market_limit: int | None,
    refresh_market: bool | None,
) -> dict[str, Any]:
    warnings = result.get("warnings") if isinstance(result.get("warnings"), list) else []
    errors = result.get("errors") if isinstance(result.get("errors"), list) else []
    stages = result.get("stages") if isinstance(result.get("stages"), list) else []

    return {
        "runId": run_id,
        "status": _history_status(result.get("status"), result.get("success")),
        "triggerSource": trigger_source or "unknown",
        "triggeredBy": triggered_by,
        "startedAt": result.get("startedAt"),
        "finishedAt": result.get("completedAt"),
        "durationSeconds": result.get("durationSeconds"),
        "limits": {
            "form4Limit": form4_limit,
            "thirteenFLimit": thirteen_f_limit,
            "marketLimit": market_limit,
            "refreshMarket": refresh_market,
        },
        "companiesFound": result.get("companiesFound") or result.get("totalCompanies"),
        "companyUniverse": result.get("companyUniverse"),
        "fundsFound": result.get("fundsFound"),
        "form4LimitApplied": result.get("form4LimitApplied"),
        "marketLimitApplied": result.get("marketLimitApplied"),
        "stages": [
            _safe_stage(stage)
            for stage in stages
            if isinstance(stage, dict)
        ],
        "totals": result.get("totals") if isinstance(result.get("totals"), dict) else {},
        "warnings": [
            _safe_issue(issue)
            for issue in warnings[:MAX_ISSUE_SAMPLE]
            if isinstance(issue, dict)
        ],
        "errors": [
            _safe_issue(issue)
            for issue in errors[:MAX_ISSUE_SAMPLE]
            if isinstance(issue, dict)
        ],
        "warningsCount": _count_issues(result, "warnings"),
        "errorsCount": _count_issues(result, "errors"),
        "latestError": _extract_error(result),
    }


def create_pipeline_history(
    db: Session,
    *,
    run_id: str,
    trigger_source: str,
    triggered_by: str | None,
    form4_limit: int,
    thirteen_f_limit: int,
    market_limit: int,
    refresh_market: bool,
    started_at: datetime | None = None,
) -> ScrapeHistory:
    started_at = started_at or datetime.utcnow()
    details = build_history_details(
        {
            "success": True,
            "status": "running",
            "startedAt": _iso(started_at),
            "completedAt": None,
            "durationSeconds": None,
            "totals": {},
            "stages": [],
            "warnings": [],
            "errors": [],
        },
        run_id=run_id,
        trigger_source=trigger_source,
        triggered_by=triggered_by,
        form4_limit=form4_limit,
        thirteen_f_limit=thirteen_f_limit,
        market_limit=market_limit,
        refresh_market=refresh_market,
    )

    history = ScrapeHistory(
        ticker="ALL",
        source_type="FULL_PIPELINE",
        status="running",
        run_id=run_id,
        trigger_source=trigger_source,
        triggered_by=triggered_by,
        started_at=started_at,
        details_json=details,
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return history


def update_pipeline_history_from_result(
    db: Session,
    *,
    run_id: str,
    result: dict[str, Any],
    trigger_source: str | None,
    triggered_by: str | None,
    form4_limit: int | None,
    thirteen_f_limit: int | None,
    market_limit: int | None,
    refresh_market: bool | None,
) -> ScrapeHistory:
    history = (
        db.query(ScrapeHistory)
        .filter(ScrapeHistory.run_id == run_id)
        .order_by(ScrapeHistory.id.desc())
        .first()
    )

    if history is None:
        started_at = _parse_datetime(result.get("startedAt")) or datetime.utcnow()
        history = ScrapeHistory(
            ticker="ALL",
            source_type="FULL_PIPELINE",
            run_id=run_id,
            started_at=started_at,
        )
        db.add(history)

    totals = result.get("totals") if isinstance(result.get("totals"), dict) else {}
    completed_at = _parse_datetime(result.get("completedAt")) or datetime.utcnow()
    details = build_history_details(
        result,
        run_id=run_id,
        trigger_source=trigger_source or history.trigger_source,
        triggered_by=triggered_by or history.triggered_by,
        form4_limit=form4_limit,
        thirteen_f_limit=thirteen_f_limit,
        market_limit=market_limit,
        refresh_market=refresh_market,
    )

    history.status = details["status"]
    history.trigger_source = details["triggerSource"]
    history.triggered_by = details.get("triggeredBy")
    history.completed_at = completed_at
    history.duration_seconds = result.get("durationSeconds")
    history.filings_found = int(totals.get("attempted") or 0)
    history.filings_processed = int(totals.get("processed") or 0)
    history.filings_skipped = int(totals.get("skipped") or 0)
    history.filings_failed = int(totals.get("failed") or 0)
    history.records_created = int(
        totals.get("recordsCreated") or totals.get("created") or 0
    )
    history.error_message = details.get("latestError")
    history.details_json = details

    db.commit()
    db.refresh(history)

    return history
