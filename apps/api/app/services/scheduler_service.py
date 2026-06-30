import logging
from datetime import datetime, timedelta
from threading import Lock
from uuid import uuid4

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.core.cache import invalidate_ingestion_caches
from app.core.config import settings
from app.db.database import SessionLocal
from app.models import Company, ScrapeHistory
from app.services.form4_ingestion_service import ingest_form4_filing
from app.services.ingestion_service import run_full_ingestion_pipeline
from app.services.scrape_history_service import (
    create_pipeline_history,
    update_pipeline_history_from_result,
)
from app.services.sec_client import get_recent_form4_filings


logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()
_ingestion_run_lock = Lock()
_latest_ingestion_run: dict = {
    "running": False,
    "currentRunId": None,
    "latestRunId": None,
    "latestStatus": None,
    "startedAt": None,
    "finishedAt": None,
    "completedAt": None,
    "durationSeconds": None,
    "latestResult": None,
    "latestError": None,
    "error": None,
    "lastHeartbeatAt": None,
    "historyId": None,
}


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _short_error(error: Exception | str, max_length: int = 220) -> str:
    message = str(error).replace("\n", " ").replace("\r", " ").strip()

    if len(message) <= max_length:
        return message

    return f"{message[:max_length].rstrip()}..."


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _mark_stale_run_if_needed_locked(now: datetime | None = None) -> None:
    if not _latest_ingestion_run["currentRunId"]:
        return

    if not _latest_ingestion_run["running"]:
        return

    now = now or datetime.utcnow()
    started_at = _parse_iso(_latest_ingestion_run.get("startedAt"))

    if not started_at:
        return

    duration_seconds = round((now - started_at).total_seconds(), 2)

    if duration_seconds <= settings.INGESTION_MAX_RUNTIME_SECONDS:
        return

    run_id = _latest_ingestion_run["currentRunId"]
    message = (
        "Pipeline run exceeded "
        f"{settings.INGESTION_MAX_RUNTIME_SECONDS} seconds. The background "
        "task may still be finishing; no duplicate run will be started."
    )
    latest_result = _latest_ingestion_run.get("latestResult")

    if not isinstance(latest_result, dict):
        latest_result = {}

    latest_result = {
        **latest_result,
        "success": False,
        "status": "stale",
        "runId": run_id,
        "message": message,
        "startedAt": _latest_ingestion_run.get("startedAt"),
        "completedAt": _iso(now),
        "durationSeconds": duration_seconds,
        "error": message,
    }

    _latest_ingestion_run.update(
        {
            "running": False,
            "latestStatus": "stale",
            "finishedAt": _iso(now),
            "completedAt": _iso(now),
            "durationSeconds": duration_seconds,
            "latestResult": latest_result,
            "latestError": message,
            "error": message,
            "lastHeartbeatAt": _iso(now),
        }
    )

    _persist_pipeline_result(
        run_id=run_id,
        result=latest_result,
        trigger_source=latest_result.get("triggerSource"),
        triggered_by=latest_result.get("triggeredBy"),
        form4_limit=latest_result.get("form4Limit"),
        thirteen_f_limit=latest_result.get("thirteenFLimit"),
        market_limit=latest_result.get("marketLimit"),
        refresh_market=latest_result.get("refreshMarket"),
    )


def _persist_pipeline_result(
    *,
    run_id: str,
    result: dict,
    trigger_source: str | None,
    triggered_by: str | None,
    form4_limit: int | None,
    thirteen_f_limit: int | None,
    market_limit: int | None,
    refresh_market: bool | None,
) -> None:
    db = SessionLocal()

    try:
        update_pipeline_history_from_result(
            db,
            run_id=run_id,
            result=result,
            trigger_source=trigger_source,
            triggered_by=triggered_by,
            form4_limit=form4_limit,
            thirteen_f_limit=thirteen_f_limit,
            market_limit=market_limit,
            refresh_market=refresh_market,
        )
    except Exception as error:
        db.rollback()
        logger.warning(
            "Could not persist ingestion history for run %s: %s",
            run_id,
            _short_error(error),
        )
    finally:
        db.close()


def _recent_success_exists(db: Session, ticker: str) -> bool:
    cutoff = datetime.utcnow() - timedelta(hours=settings.SCRAPER_COOLDOWN_HOURS)

    recent = (
        db.query(ScrapeHistory)
        .filter(
            ScrapeHistory.ticker == ticker,
            ScrapeHistory.source_type == "SEC_FORM_4",
            ScrapeHistory.status == "processed",
            ScrapeHistory.completed_at >= cutoff,
        )
        .first()
    )

    return recent is not None


def scrape_company_form4(ticker: str, limit: int | None = None) -> dict:
    db = SessionLocal()
    symbol = ticker.strip().upper()
    max_filings = limit or settings.SCRAPER_MAX_FILINGS

    history = ScrapeHistory(
        ticker=symbol,
        source_type="SEC_FORM_4",
        status="started",
        started_at=datetime.utcnow(),
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    try:
        company = db.query(Company).filter(Company.ticker == symbol).first()

        if not company:
            history.status = "failed"
            history.error_message = f"{symbol} is not currently tracked"
            history.completed_at = datetime.utcnow()
            db.commit()

            return {
                "ticker": symbol,
                "status": "failed",
                "error": history.error_message,
            }

        history.company_id = company.id

        if not company.cik:
            history.status = "failed"
            history.error_message = f"{symbol} does not have CIK"
            history.completed_at = datetime.utcnow()
            db.commit()

            return {
                "ticker": symbol,
                "status": "failed",
                "error": history.error_message,
            }

        if _recent_success_exists(db, symbol):
            history.status = "skipped"
            history.error_message = "Cooldown active"
            history.completed_at = datetime.utcnow()
            db.commit()

            return {
                "ticker": symbol,
                "status": "skipped",
                "reason": "cooldown_active",
            }

        filings = get_recent_form4_filings(company.cik, limit=max_filings)

        history.filings_found = len(filings)

        processed_count = 0
        skipped_count = 0
        failed_count = 0
        records_created = 0
        results = []

        for filing in filings:
            try:
                result = ingest_form4_filing(db, company, filing)

                status = result.get("status")
                created = result.get("recordsCreated", 0)

                if status == "skipped":
                    skipped_count += 1
                else:
                    processed_count += 1
                    records_created += created

                results.append(
                    {
                        "accessionNumber": filing.get("accessionNumber"),
                        "status": status,
                        "recordsCreated": created,
                    }
                )

            except Exception as error:
                failed_count += 1
                results.append(
                    {
                        "accessionNumber": filing.get("accessionNumber"),
                        "status": "failed",
                        "error": str(error),
                    }
                )

        history.status = "processed" if failed_count == 0 else "processed_with_errors"
        history.filings_processed = processed_count
        history.filings_skipped = skipped_count
        history.filings_failed = failed_count
        history.records_created = records_created
        history.completed_at = datetime.utcnow()

        db.commit()

        return {
            "ticker": symbol,
            "status": history.status,
            "filingsFound": history.filings_found,
            "processedCount": processed_count,
            "skippedCount": skipped_count,
            "failedCount": failed_count,
            "recordsCreated": records_created,
            "results": results,
        }

    except Exception as error:
        db.rollback()

        history.status = "failed"
        history.error_message = str(error)
        history.completed_at = datetime.utcnow()

        db.add(history)
        db.commit()

        return {
            "ticker": symbol,
            "status": "failed",
            "error": str(error),
        }

    finally:
        db.close()


def scrape_all_tracked_companies(limit: int | None = None) -> dict:
    db = SessionLocal()

    try:
        companies = (
            db.query(Company)
            .filter(Company.cik.isnot(None))
            .order_by(Company.ticker.asc())
            .all()
        )

        tickers = [company.ticker for company in companies]

    finally:
        db.close()

    results = []

    for ticker in tickers:
        results.append(scrape_company_form4(ticker, limit=limit))

    return {
        "companiesFound": len(tickers),
        "results": results,
    }


def scheduled_scrape_job():
    run_ingestion_once(
        form4_limit=settings.SCRAPER_MAX_FILINGS,
        thirteen_f_limit=settings.SCRAPER_13F_MAX_FILINGS,
        refresh_market=settings.SCRAPER_REFRESH_MARKET,
        market_limit=25,
        trigger_source="scheduled",
    )


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(
        scheduled_scrape_job,
        "interval",
        hours=settings.SCRAPER_SCHEDULE_HOURS,
        id="full_ingestion_pipeline",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)


def get_scheduler_status() -> dict:
    jobs = []

    if scheduler.running:
        jobs = [
            {
                "id": job.id,
                "nextRunTime": job.next_run_time.isoformat()
                if job.next_run_time
                else None,
            }
            for job in scheduler.get_jobs()
        ]

    with _ingestion_run_lock:
        _mark_stale_run_if_needed_locked()
        run_state = dict(_latest_ingestion_run)

    return {
        "running": run_state["running"],
        "currentRunId": run_state["currentRunId"],
        "schedulerRunning": scheduler.running,
        "jobs": jobs,
        "scheduleHours": settings.SCRAPER_SCHEDULE_HOURS,
        "maxFilings": settings.SCRAPER_MAX_FILINGS,
        "thirteenFMaxFilings": settings.SCRAPER_13F_MAX_FILINGS,
        "refreshMarket": settings.SCRAPER_REFRESH_MARKET,
        "cooldownHours": settings.SCRAPER_COOLDOWN_HOURS,
        "latestRunId": run_state["latestRunId"],
        "latestStatus": run_state["latestStatus"],
        "startedAt": run_state["startedAt"],
        "finishedAt": run_state["finishedAt"],
        "completedAt": run_state["completedAt"],
        "durationSeconds": run_state["durationSeconds"],
        "latestResult": run_state["latestResult"],
        "latestError": run_state["latestError"],
        "error": run_state["error"],
        "lastHeartbeatAt": run_state["lastHeartbeatAt"],
        "ingestionMaxRuntimeSeconds": settings.INGESTION_MAX_RUNTIME_SECONDS,
    }


def start_ingestion_run(
    form4_limit: int = 5,
    thirteen_f_limit: int = 3,
    refresh_market: bool = True,
    market_limit: int = 25,
    trigger_source: str = "unknown",
    triggered_by: str | None = None,
) -> dict:
    started_at = datetime.utcnow()

    with _ingestion_run_lock:
        _mark_stale_run_if_needed_locked(started_at)

        if _latest_ingestion_run["currentRunId"]:
            latest_status = _latest_ingestion_run.get("latestStatus")
            message = (
                "Pipeline is already running."
                if latest_status != "stale"
                else "Pipeline run is stale but still reserved; no duplicate task was started."
            )

            return {
                "success": True,
                "status": "already_running",
                "runId": _latest_ingestion_run["currentRunId"],
                "message": message,
                "startedAt": _latest_ingestion_run["startedAt"],
                "completedAt": _latest_ingestion_run["completedAt"],
                "durationSeconds": _latest_ingestion_run["durationSeconds"],
            }

        run_id = str(uuid4())
        _latest_ingestion_run.update(
            {
                "running": True,
                "currentRunId": run_id,
                "latestRunId": run_id,
                "latestStatus": "starting",
                "startedAt": _iso(started_at),
                "finishedAt": None,
                "completedAt": None,
                "durationSeconds": None,
                "latestResult": {
                    "success": True,
                    "status": "starting",
                    "runId": run_id,
                    "message": "Pipeline history is being initialized.",
                    "startedAt": _iso(started_at),
                    "completedAt": None,
                    "durationSeconds": None,
                    "triggerSource": trigger_source,
                    "triggeredBy": triggered_by,
                    "form4Limit": form4_limit,
                    "thirteenFLimit": thirteen_f_limit,
                    "marketLimit": market_limit,
                    "refreshMarket": refresh_market,
                },
                "latestError": None,
                "error": None,
                "lastHeartbeatAt": _iso(started_at),
                "historyId": None,
            }
        )

    db = SessionLocal()

    try:
        history = create_pipeline_history(
            db,
            run_id=run_id,
            trigger_source=trigger_source,
            triggered_by=triggered_by,
            form4_limit=form4_limit,
            thirteen_f_limit=thirteen_f_limit,
            market_limit=market_limit,
            refresh_market=refresh_market,
            started_at=started_at,
        )
        history_id = history.id
    except Exception:
        with _ingestion_run_lock:
            if _latest_ingestion_run["currentRunId"] == run_id:
                _latest_ingestion_run.update(
                    {
                        "running": False,
                        "currentRunId": None,
                        "latestStatus": "failed",
                        "finishedAt": _iso(datetime.utcnow()),
                        "completedAt": _iso(datetime.utcnow()),
                        "latestError": "Could not initialize ingestion history.",
                        "error": "Could not initialize ingestion history.",
                    }
                )
        raise
    finally:
        db.close()

    with _ingestion_run_lock:
        _latest_ingestion_run.update(
            {
                "running": True,
                "currentRunId": run_id,
                "latestRunId": run_id,
                "latestStatus": "running",
                "startedAt": _iso(started_at),
                "finishedAt": None,
                "completedAt": None,
                "durationSeconds": None,
                "latestResult": {
                    "success": True,
                    "status": "running",
                    "runId": run_id,
                    "message": "Pipeline started.",
                    "startedAt": _iso(started_at),
                    "completedAt": None,
                    "durationSeconds": None,
                    "triggerSource": trigger_source,
                    "triggeredBy": triggered_by,
                    "form4Limit": form4_limit,
                    "thirteenFLimit": thirteen_f_limit,
                    "marketLimit": market_limit,
                    "refreshMarket": refresh_market,
                    "historyId": history_id,
                },
                "latestError": None,
                "error": None,
                "lastHeartbeatAt": _iso(started_at),
                "historyId": history_id,
            }
        )

    return {
        "success": True,
        "status": "started",
        "runId": run_id,
        "message": "Pipeline started",
        "startedAt": _iso(started_at),
        "completedAt": None,
        "durationSeconds": None,
        "triggerSource": trigger_source,
        "triggeredBy": triggered_by,
        "form4Limit": form4_limit,
        "thirteenFLimit": thirteen_f_limit,
        "marketLimit": market_limit,
        "refreshMarket": refresh_market,
        "historyId": history_id,
    }


def run_ingestion_background(
    run_id: str,
    form4_limit: int = 5,
    thirteen_f_limit: int = 3,
    refresh_market: bool = True,
    market_limit: int = 25,
    trigger_source: str = "unknown",
    triggered_by: str | None = None,
) -> None:
    db = SessionLocal()
    started_at = datetime.utcnow()

    try:
        with _ingestion_run_lock:
            if _latest_ingestion_run["latestRunId"] == run_id:
                _latest_ingestion_run.update(
                    {
                        "running": True,
                        "latestStatus": "running",
                        "lastHeartbeatAt": _iso(started_at),
                    }
                )

        result = run_full_ingestion_pipeline(
            db,
            form4_limit=form4_limit,
            thirteen_f_limit=thirteen_f_limit,
            refresh_market=refresh_market,
            market_limit=market_limit,
            run_id=run_id,
            trigger_source=trigger_source,
            triggered_by=triggered_by,
        )

        completed_at = datetime.utcnow()
        duration_seconds = round((completed_at - started_at).total_seconds(), 2)
        result = {
            **result,
            "runId": run_id,
            "triggerSource": trigger_source,
            "triggeredBy": triggered_by,
            "form4Limit": form4_limit,
            "thirteenFLimit": thirteen_f_limit,
            "marketLimit": market_limit,
            "refreshMarket": refresh_market,
            "durationSeconds": result.get("durationSeconds") or duration_seconds,
        }

        with _ingestion_run_lock:
            if _latest_ingestion_run["latestRunId"] == run_id:
                _latest_ingestion_run.update(
                    {
                        "running": False,
                        "currentRunId": None,
                        "latestStatus": result.get("status") or "success",
                        "finishedAt": result.get("completedAt")
                        or _iso(completed_at),
                        "completedAt": result.get("completedAt")
                        or _iso(completed_at),
                        "durationSeconds": result.get("durationSeconds"),
                        "latestResult": result,
                        "latestError": result.get("error"),
                        "error": result.get("error"),
                        "lastHeartbeatAt": _iso(completed_at),
                    }
                )

        invalidate_ingestion_caches(
            market_changed=bool(refresh_market and market_limit > 0),
            signals_changed=bool(form4_limit > 0 or thirteen_f_limit > 0),
        )

    except Exception as error:
        completed_at = datetime.utcnow()
        error_message = _short_error(error)
        logger.exception("Ingestion pipeline run %s failed: %s", run_id, error_message)
        result = {
            "success": False,
            "status": "failed",
            "runId": run_id,
            "message": "Pipeline failed.",
            "startedAt": _iso(started_at),
            "completedAt": _iso(completed_at),
            "durationSeconds": round((completed_at - started_at).total_seconds(), 2),
            "marketLimit": market_limit,
            "triggerSource": trigger_source,
            "triggeredBy": triggered_by,
            "form4Limit": form4_limit,
            "thirteenFLimit": thirteen_f_limit,
            "refreshMarket": refresh_market,
            "stages": [],
            "totals": {
                "processed": 0,
                "skipped": 0,
                "failed": 1,
                "recordsCreated": 0,
                "warnings": 0,
                "errors": 1,
            },
            "warnings": [],
            "errors": [{"stage": "pipeline", "message": error_message}],
            "error": error_message,
        }

        with _ingestion_run_lock:
            if _latest_ingestion_run["latestRunId"] == run_id:
                _latest_ingestion_run.update(
                    {
                        "running": False,
                        "currentRunId": None,
                        "latestStatus": "failed",
                        "finishedAt": _iso(completed_at),
                        "completedAt": _iso(completed_at),
                        "durationSeconds": result["durationSeconds"],
                        "latestResult": result,
                        "latestError": error_message,
                        "error": error_message,
                        "lastHeartbeatAt": _iso(completed_at),
                    }
                )

        _persist_pipeline_result(
            run_id=run_id,
            result=result,
            trigger_source=trigger_source,
            triggered_by=triggered_by,
            form4_limit=form4_limit,
            thirteen_f_limit=thirteen_f_limit,
            market_limit=market_limit,
            refresh_market=refresh_market,
        )

    finally:
        with _ingestion_run_lock:
            if (
                _latest_ingestion_run["latestRunId"] == run_id
                and _latest_ingestion_run["currentRunId"] == run_id
            ):
                completed_at = datetime.utcnow()
                message = "Pipeline ended without publishing a final result."
                _latest_ingestion_run.update(
                    {
                        "running": False,
                        "currentRunId": None,
                        "latestStatus": "failed",
                        "finishedAt": _iso(completed_at),
                        "completedAt": _iso(completed_at),
                        "latestError": message,
                        "error": message,
                        "lastHeartbeatAt": _iso(completed_at),
                    }
                )

        db.close()


def run_ingestion_once(
    form4_limit: int = 5,
    thirteen_f_limit: int = 3,
    refresh_market: bool = True,
    market_limit: int = 25,
    trigger_source: str = "manual",
    triggered_by: str | None = None,
) -> dict:
    run = start_ingestion_run(
        form4_limit=form4_limit,
        thirteen_f_limit=thirteen_f_limit,
        refresh_market=refresh_market,
        market_limit=market_limit,
        trigger_source=trigger_source,
        triggered_by=triggered_by,
    )

    if run["status"] == "started":
        run_ingestion_background(
            run["runId"],
            form4_limit=form4_limit,
            thirteen_f_limit=thirteen_f_limit,
            refresh_market=refresh_market,
            market_limit=market_limit,
            trigger_source=trigger_source,
            triggered_by=triggered_by,
        )

    return get_scheduler_status()

