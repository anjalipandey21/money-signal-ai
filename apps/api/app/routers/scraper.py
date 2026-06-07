from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Company
from app.services.sec_client import (
    SECClientError,
    get_13f_information_table_document,
    get_filing_document,
    get_recent_13f_filings,
    get_recent_form4_filings,
)
from app.services.form13f_parser import Form13FParserError, parse_13f_information_table
from app.services.form4_parser import Form4ParserError, parse_form4_xml
from app.services.form4_ingestion_service import ingest_form4_filing
from app.models import Company, ScrapeHistory
from app.services.form13f_ingestion_service import ingest_13f_filing
from app.services.sec_client import get_recent_13f_filings


router = APIRouter(prefix="/scraper", tags=["Scraper"])


@router.get("/sec-form4/{ticker}")
def preview_sec_form4_filings(
    ticker: str,
    limit: int = Query(5, ge=1, le=25),
    db: Session = Depends(get_db),
):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    if not company.cik:
        raise HTTPException(
            status_code=400,
            detail=f"{symbol} does not have a CIK stored in the database",
        )

    try:
        filings = get_recent_form4_filings(company.cik, limit=limit)

    except SECClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return {
        "ticker": company.ticker,
        "companyName": company.name,
        "cik": company.cik,
        "count": len(filings),
        "filings": filings,
    }

@router.get("/sec-form4/{ticker}/parse-latest")
def parse_latest_sec_form4_filing(
    ticker: str,
    db: Session = Depends(get_db),
):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    if not company.cik:
        raise HTTPException(
            status_code=400,
            detail=f"{symbol} does not have a CIK stored in the database",
        )

    try:
        filings = get_recent_form4_filings(company.cik, limit=1)

        if not filings:
            return {
                "ticker": company.ticker,
                "companyName": company.name,
                "message": "No recent Form 4 filings found",
                "parsed": None,
            }

        filing = filings[0]
        xml_text = get_filing_document(filing["filingUrl"])
        parsed = parse_form4_xml(xml_text, filing_url=filing["filingUrl"])

    except SECClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    except Form4ParserError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return {
        "ticker": company.ticker,
        "companyName": company.name,
        "filing": filing,
        "parsed": parsed,
    }

@router.post("/sec-form4/{ticker}/ingest-latest")
def ingest_latest_sec_form4_filing(
    ticker: str,
    db: Session = Depends(get_db),
):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    if not company.cik:
        raise HTTPException(
            status_code=400,
            detail=f"{symbol} does not have a CIK stored in the database",
        )

    try:
        filings = get_recent_form4_filings(company.cik, limit=1)

        if not filings:
            return {
                "ticker": company.ticker,
                "companyName": company.name,
                "message": "No recent Form 4 filings found",
            }

        result = ingest_form4_filing(db, company, filings[0])

        db.commit()

        return {
            "ticker": company.ticker,
            "companyName": company.name,
            "result": result,
        }

    except SECClientError as error:
        db.rollback()
        raise HTTPException(status_code=502, detail=str(error)) from error

    except Form4ParserError as error:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(error)) from error

    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(error)) from error

@router.post("/sec-form4/{ticker}/ingest-recent")
def ingest_recent_sec_form4_filings(
    ticker: str,
    limit: int = Query(10, ge=1, le=25),
    db: Session = Depends(get_db),
):
    symbol = ticker.strip().upper()

    company = db.query(Company).filter(Company.ticker == symbol).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} is not currently tracked",
        )

    if not company.cik:
        raise HTTPException(
            status_code=400,
            detail=f"{symbol} does not have a CIK stored in the database",
        )

    results = []
    processed_count = 0
    skipped_count = 0
    error_count = 0
    total_records_created = 0

    try:
        filings = get_recent_form4_filings(company.cik, limit=limit)

        for filing in filings:
            try:
                result = ingest_form4_filing(db, company, filing)

                results.append(
                    {
                        "accessionNumber": filing.get("accessionNumber"),
                        "filingDate": filing.get("filingDate"),
                        "status": result.get("status"),
                        "recordsCreated": result.get("recordsCreated", 0),
                    }
                )

                if result.get("status") == "skipped":
                    skipped_count += 1
                else:
                    processed_count += 1
                    total_records_created += result.get("recordsCreated", 0)

            except Exception as filing_error:
                error_count += 1
                results.append(
                    {
                        "accessionNumber": filing.get("accessionNumber"),
                        "filingDate": filing.get("filingDate"),
                        "status": "error",
                        "error": str(filing_error),
                    }
                )

        db.commit()

        return {
            "ticker": company.ticker,
            "companyName": company.name,
            "filingsFound": len(filings),
            "processedCount": processed_count,
            "skippedCount": skipped_count,
            "errorCount": error_count,
            "totalRecordsCreated": total_records_created,
            "results": results,
        }

    except SECClientError as error:
        db.rollback()
        raise HTTPException(status_code=502, detail=str(error)) from error

    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(error)) from error

@router.get("/history")
def get_scrape_history(
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ScrapeHistory)
        .order_by(ScrapeHistory.started_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": row.id,
            "ticker": row.ticker,
            "sourceType": row.source_type,
            "status": row.status,
            "filingsFound": row.filings_found,
            "filingsProcessed": row.filings_processed,
            "filingsSkipped": row.filings_skipped,
            "filingsFailed": row.filings_failed,
            "recordsCreated": row.records_created,
            "errorMessage": row.error_message,
            "startedAt": row.started_at.isoformat() if row.started_at else None,
            "completedAt": row.completed_at.isoformat() if row.completed_at else None,
        }
        for row in rows
    ]

@router.get("/sec-13f/{cik}/filings")
def preview_sec_13f_filings(
    cik: str,
    limit: int = Query(5, ge=1, le=25),
):
    try:
        filings = get_recent_13f_filings(cik, limit=limit)

    except SECClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return {
        "cik": cik,
        "count": len(filings),
        "filings": filings,
    }


@router.get("/sec-13f/{cik}/parse-latest")
def parse_latest_sec_13f_filing(
    cik: str,
):
    try:
        filings = get_recent_13f_filings(cik, limit=5)

        if not filings:
            return {
                "cik": cik,
                "message": "No recent 13F filings found",
                "parsed": None,
            }

        errors = []

        for filing in filings:
            try:
                information_table_url, xml_text = get_13f_information_table_document(filing)
                parsed = parse_13f_information_table(
                    xml_text,
                    filing_url=information_table_url,
                )

                return {
                    "cik": cik,
                    "filing": filing,
                    "informationTableUrl": information_table_url,
                    "parsed": {
                        **parsed,
                        "holdings": parsed["holdings"][:25],
                    },
                }

            except Exception as parse_error:
                errors.append(
                    {
                        "accessionNumber": filing.get("accessionNumber"),
                        "error": str(parse_error),
                    }
                )

        raise HTTPException(
            status_code=422,
            detail={
                "message": "Could not parse any recent 13F filings",
                "errors": errors,
            },
        )

    except SECClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    except Form13FParserError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

@router.post("/sec-13f/{cik}/ingest-latest")
def ingest_latest_sec_13f_filing(
    cik: str,
    db: Session = Depends(get_db),
):
    try:
        filings = get_recent_13f_filings(cik, limit=1)

        if not filings:
            return {
                "cik": cik,
                "message": "No recent 13F filings found",
            }

        result = ingest_13f_filing(db, cik, filings[0])

        db.commit()

        return {
            "cik": cik,
            "result": result,
        }

    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/sec-13f/{cik}/ingest-recent")
def ingest_recent_sec_13f_filings(
    cik: str,
    limit: int = Query(3, ge=1, le=10),
    db: Session = Depends(get_db),
):
    results = []
    processed_count = 0
    skipped_count = 0
    error_count = 0
    total_records_created = 0

    try:
        filings = get_recent_13f_filings(cik, limit=limit)

        for filing in filings:
            try:
                result = ingest_13f_filing(db, cik, filing)

                results.append(
                    {
                        "accessionNumber": filing.get("accessionNumber"),
                        "filingDate": filing.get("filingDate"),
                        "status": result.get("status"),
                        "recordsCreated": result.get("recordsCreated", 0),
                        "companiesMatched": result.get("companiesMatched", 0),
                        "impactedTickers": result.get("impactedTickers", []),
                    }
                )

                if result.get("status") == "skipped":
                    skipped_count += 1
                else:
                    processed_count += 1
                    total_records_created += result.get("recordsCreated", 0)

            except Exception as filing_error:
                error_count += 1
                results.append(
                    {
                        "accessionNumber": filing.get("accessionNumber"),
                        "filingDate": filing.get("filingDate"),
                        "status": "error",
                        "error": str(filing_error),
                    }
                )

        db.commit()

        return {
            "cik": cik,
            "filingsFound": len(filings),
            "processedCount": processed_count,
            "skippedCount": skipped_count,
            "errorCount": error_count,
            "totalRecordsCreated": total_records_created,
            "results": results,
        }

    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(error)) from error