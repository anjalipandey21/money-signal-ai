from fastapi import APIRouter, BackgroundTasks, Depends, Query

from app.core.security import get_current_admin_user
from app.models import User
from app.services.scheduler_service import (
    get_scheduler_status,
    run_ingestion_background,
    scrape_all_tracked_companies,
    scrape_company_form4,
    start_ingestion_run,
    start_scheduler,
    stop_scheduler,
)


router = APIRouter(
    prefix="/scheduler",
    tags=["Scheduler"],
    dependencies=[Depends(get_current_admin_user)],
)


@router.get("/status")
def scheduler_status():
    return get_scheduler_status()


@router.post("/start")
def start_scraper_scheduler(_current_user: User = Depends(get_current_admin_user)):
    start_scheduler()
    return get_scheduler_status()


@router.post("/stop")
def stop_scraper_scheduler(_current_user: User = Depends(get_current_admin_user)):
    stop_scheduler()
    return get_scheduler_status()


@router.post("/scrape/{ticker}")
def run_company_scrape(
    ticker: str,
    limit: int = Query(10, ge=1, le=25),
    _current_user: User = Depends(get_current_admin_user),
):
    return scrape_company_form4(ticker, limit=limit)


@router.post("/scrape-all")
def run_all_company_scrapes(
    limit: int = Query(5, ge=1, le=25),
    _current_user: User = Depends(get_current_admin_user),
):
    return scrape_all_tracked_companies(limit=limit)


@router.post("/run-ingestion")
def run_full_ingestion(
    background_tasks: BackgroundTasks,
    form4_limit: int = Query(5, ge=1, le=25),
    thirteen_f_limit: int = Query(3, ge=1, le=10),
    refresh_market: bool = Query(True),
    market_limit: int = Query(25, ge=1, le=100),
    _current_user: User = Depends(get_current_admin_user),
):
    response = start_ingestion_run(
        form4_limit=form4_limit,
        thirteen_f_limit=thirteen_f_limit,
        refresh_market=refresh_market,
        market_limit=market_limit,
    )

    if response["status"] == "started":
        background_tasks.add_task(
            run_ingestion_background,
            response["runId"],
            form4_limit=form4_limit,
            thirteen_f_limit=thirteen_f_limit,
            refresh_market=refresh_market,
            market_limit=market_limit,
        )

    return response
