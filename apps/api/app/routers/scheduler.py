from fastapi import APIRouter, Query

from app.services.scheduler_service import (
    get_scheduler_status,
    scrape_all_tracked_companies,
    scrape_company_form4,
    start_scheduler,
    stop_scheduler,
)


router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


@router.get("/status")
def scheduler_status():
    return get_scheduler_status()


@router.post("/start")
def start_scraper_scheduler():
    start_scheduler()
    return get_scheduler_status()


@router.post("/stop")
def stop_scraper_scheduler():
    stop_scheduler()
    return get_scheduler_status()


@router.post("/scrape/{ticker}")
def run_company_scrape(
    ticker: str,
    limit: int = Query(10, ge=1, le=25),
):
    return scrape_company_form4(ticker, limit=limit)


@router.post("/scrape-all")
def run_all_company_scrapes(
    limit: int = Query(5, ge=1, le=25),
):
    return scrape_all_tracked_companies(limit=limit)