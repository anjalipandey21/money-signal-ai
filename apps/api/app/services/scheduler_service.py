from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import SessionLocal
from app.models import Company, ScrapeHistory
from app.services.form4_ingestion_service import ingest_form4_filing
from app.services.sec_client import get_recent_form4_filings


scheduler = BackgroundScheduler()


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
    scrape_all_tracked_companies(limit=settings.SCRAPER_MAX_FILINGS)


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(
        scheduled_scrape_job,
        "interval",
        hours=settings.SCRAPER_SCHEDULE_HOURS,
        id="sec_form4_scraper",
        replace_existing=True,
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

    return {
        "running": scheduler.running,
        "jobs": jobs,
        "scheduleHours": settings.SCRAPER_SCHEDULE_HOURS,
        "maxFilings": settings.SCRAPER_MAX_FILINGS,
        "cooldownHours": settings.SCRAPER_COOLDOWN_HOURS,
    }