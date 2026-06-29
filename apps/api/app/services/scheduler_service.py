from datetime import datetime, timedelta
from threading import Lock
from uuid import uuid4

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import SessionLocal
from app.models import Company, ScrapeHistory
from app.services.form4_ingestion_service import ingest_form4_filing
from app.services.ingestion_service import run_full_ingestion_pipeline
from app.services.sec_client import get_recent_form4_filings


scheduler = BackgroundScheduler()
_ingestion_run_lock = Lock()
_latest_ingestion_run: dict = {
    "running": False,
    "latestRunId": None,
    "latestStatus": None,
    "startedAt": None,
    "completedAt": None,
    "durationSeconds": None,
    "latestResult": None,
    "error": None,
}


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


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
    db = SessionLocal()

    try:
        run_full_ingestion_pipeline(
            db,
            form4_limit=settings.SCRAPER_MAX_FILINGS,
            thirteen_f_limit=settings.SCRAPER_13F_MAX_FILINGS,
            refresh_market=settings.SCRAPER_REFRESH_MARKET,
            market_limit=25,
        )

    finally:
        db.close()


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
        run_state = dict(_latest_ingestion_run)

    return {
        "running": run_state["running"],
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
        "completedAt": run_state["completedAt"],
        "durationSeconds": run_state["durationSeconds"],
        "latestResult": run_state["latestResult"],
        "error": run_state["error"],
    }


def start_ingestion_run(
    form4_limit: int = 5,
    thirteen_f_limit: int = 3,
    refresh_market: bool = True,
    market_limit: int = 25,
) -> dict:
    started_at = datetime.utcnow()

    with _ingestion_run_lock:
        if _latest_ingestion_run["running"]:
            return {
                "success": True,
                "status": "running",
                "runId": _latest_ingestion_run["latestRunId"],
                "message": "Pipeline is already running.",
                "startedAt": _latest_ingestion_run["startedAt"],
                "completedAt": None,
                "durationSeconds": None,
            }

        run_id = str(uuid4())

        # TODO: Persist run state in a dedicated pipeline_runs table when the
        # admin pipeline needs cross-process or multi-worker visibility.
        _latest_ingestion_run.update(
            {
                "running": True,
                "latestRunId": run_id,
                "latestStatus": "running",
                "startedAt": _iso(started_at),
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
                    "marketLimit": market_limit,
                },
                "error": None,
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
        "marketLimit": market_limit,
    }


def run_ingestion_background(
    run_id: str,
    form4_limit: int = 5,
    thirteen_f_limit: int = 3,
    refresh_market: bool = True,
    market_limit: int = 25,
) -> None:
    db = SessionLocal()
    started_at = datetime.utcnow()

    try:
        result = run_full_ingestion_pipeline(
            db,
            form4_limit=form4_limit,
            thirteen_f_limit=thirteen_f_limit,
            refresh_market=refresh_market,
            market_limit=market_limit,
        )

        completed_at = datetime.utcnow()
        duration_seconds = round((completed_at - started_at).total_seconds(), 2)
        result = {
            **result,
            "runId": run_id,
            "marketLimit": market_limit,
            "durationSeconds": result.get("durationSeconds") or duration_seconds,
        }

        with _ingestion_run_lock:
            if _latest_ingestion_run["latestRunId"] == run_id:
                _latest_ingestion_run.update(
                    {
                        "running": False,
                        "latestStatus": result.get("status") or "success",
                        "completedAt": result.get("completedAt")
                        or _iso(completed_at),
                        "durationSeconds": result.get("durationSeconds"),
                        "latestResult": result,
                        "error": result.get("error"),
                    }
                )

    except Exception as error:
        completed_at = datetime.utcnow()
        result = {
            "success": False,
            "status": "failed",
            "runId": run_id,
            "message": "Pipeline failed.",
            "startedAt": _iso(started_at),
            "completedAt": _iso(completed_at),
            "durationSeconds": round((completed_at - started_at).total_seconds(), 2),
            "marketLimit": market_limit,
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
            "errors": [{"stage": "pipeline", "message": str(error)}],
            "error": str(error),
        }

        with _ingestion_run_lock:
            if _latest_ingestion_run["latestRunId"] == run_id:
                _latest_ingestion_run.update(
                    {
                        "running": False,
                        "latestStatus": "failed",
                        "completedAt": _iso(completed_at),
                        "durationSeconds": result["durationSeconds"],
                        "latestResult": result,
                        "error": str(error),
                    }
                )

    finally:
        db.close()


def run_ingestion_once(
    form4_limit: int = 5,
    thirteen_f_limit: int = 3,
    refresh_market: bool = True,
    market_limit: int = 25,
) -> dict:
    run = start_ingestion_run(
        form4_limit=form4_limit,
        thirteen_f_limit=thirteen_f_limit,
        refresh_market=refresh_market,
        market_limit=market_limit,
    )

    if run["status"] == "started":
        run_ingestion_background(
            run["runId"],
            form4_limit=form4_limit,
            thirteen_f_limit=thirteen_f_limit,
            refresh_market=refresh_market,
            market_limit=market_limit,
        )

    return get_scheduler_status()
