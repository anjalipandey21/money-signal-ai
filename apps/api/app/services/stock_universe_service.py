from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.models import Company
from app.services.sec_client import SECClientError, get_json


SEC_COMPANY_TICKERS_EXCHANGE_URL = (
    "https://www.sec.gov/files/company_tickers_exchange.json"
)


class StockUniverseError(Exception):
    pass


EXCLUDE_NAME_KEYWORDS = [
    "acquisition",
    "blank check",
    "warrant",
    "warrants",
    "unit",
    "units",
    "right",
    "rights",
    "preferred",
    "preference",
    "depositary",
    "note",
    "notes",
    "bond",
    "bonds",
    "etf",
    "etn",
    "fund",
    "trust",
]


EXCLUDE_TICKER_SUFFIXES = [
    "W",
    "WS",
    "WT",
    "U",
    "R",
]


SUPPORTED_EXCHANGES = {"NASDAQ", "NYSE", "NYSE AMERICAN"}


def _clean_ticker(value: str) -> str:
    return value.strip().upper().replace(".", "-")


def _clean_exchange(value: str | None) -> str | None:
    if not value:
        return None

    exchange = value.strip()

    if exchange.upper() == "NASDAQ":
        return "Nasdaq"

    return exchange


def _looks_like_common_stock(
    ticker: str,
    name: str,
    exchange: str | None,
    include_funds: bool = False,
    include_otc: bool = False,
) -> bool:
    if not ticker or not name:
        return False

    normalized_exchange = (exchange or "").upper()

    if normalized_exchange == "OTC" and not include_otc:
        return False

    if normalized_exchange not in SUPPORTED_EXCHANGES and not include_otc:
        return False

    if include_funds:
        return True

    lowered_name = name.lower()

    if any(keyword in lowered_name for keyword in EXCLUDE_NAME_KEYWORDS):
        return False

    if len(ticker) > 4 and any(
        ticker.endswith(suffix) for suffix in EXCLUDE_TICKER_SUFFIXES
    ):
        return False

    return True


def fetch_sec_stock_universe() -> list[dict[str, Any]]:
    try:
        payload = get_json(
            SEC_COMPANY_TICKERS_EXCHANGE_URL,
            request_kind="company ticker universe",
        )

    except (SECClientError, httpx.HTTPError) as error:
        raise StockUniverseError("Failed to fetch SEC company ticker universe") from error

    fields = payload.get("fields", [])
    rows = payload.get("data", [])

    if not fields or not rows:
        raise StockUniverseError("SEC company ticker universe returned no data")

    universe = []

    for row in rows:
        item = dict(zip(fields, row))

        ticker = _clean_ticker(str(item.get("ticker") or ""))
        name = str(item.get("name") or "").strip()
        cik = item.get("cik")
        exchange = _clean_exchange(str(item.get("exchange") or "").strip())

        if not ticker or not name:
            continue

        universe.append(
            {
                "ticker": ticker,
                "name": name,
                "cik": str(cik).strip() if cik else None,
                "exchange": exchange,
            }
        )

    return universe


def find_sec_company_by_ticker(ticker: str) -> dict[str, Any] | None:
    symbol = _clean_ticker(ticker)

    if not symbol:
        return None

    for item in fetch_sec_stock_universe():
        if item["ticker"] == symbol:
            return item

    return None


def _enrich_profile(ticker: str) -> dict[str, str | None]:
    try:
        import yfinance as yf

        info = yf.Ticker(ticker).get_info()

        return {
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "website": info.get("website"),
        }

    except Exception:
        return {
            "sector": None,
            "industry": None,
            "website": None,
        }


def import_stock_universe(
    db: Session,
    limit: int = 500,
    include_funds: bool = False,
    include_otc: bool = False,
    enrich_profile: bool = False,
) -> dict[str, Any]:
    universe = fetch_sec_stock_universe()

    created = 0
    updated = 0
    skipped = 0
    scanned = 0
    duplicate_cik_skipped = 0

    existing_ciks = {
        row[0]
        for row in db.query(Company.cik)
        .filter(Company.cik.isnot(None))
        .all()
        if row[0]
    }

    used_ciks = set(existing_ciks)

    for item in sorted(universe, key=lambda row: row["ticker"]):
        if created + updated >= limit:
            break

        scanned += 1

        ticker = item["ticker"]
        name = item["name"]
        exchange = item.get("exchange")
        raw_cik = item.get("cik")
        cik = str(raw_cik).strip() if raw_cik else None

        if not _looks_like_common_stock(
            ticker=ticker,
            name=name,
            exchange=exchange,
            include_funds=include_funds,
            include_otc=include_otc,
        ):
            skipped += 1
            continue

        company = db.query(Company).filter(Company.ticker == ticker).first()

        safe_cik = None

        if cik:
            if cik in used_ciks:
                duplicate_cik_skipped += 1
            else:
                safe_cik = cik
                used_ciks.add(cik)

        if company:
            company.name = company.name or name
            company.exchange = company.exchange or exchange

            if not company.cik and safe_cik:
                company.cik = safe_cik

            if enrich_profile and (not company.sector or not company.industry):
                profile = _enrich_profile(ticker)
                company.sector = company.sector or profile["sector"]
                company.industry = company.industry or profile["industry"]
                company.website = company.website or profile["website"]

            updated += 1

        else:
            profile = _enrich_profile(ticker) if enrich_profile else {}

            company = Company(
                ticker=ticker,
                name=name,
                cik=safe_cik,
                exchange=exchange,
                sector=profile.get("sector"),
                industry=profile.get("industry"),
                website=profile.get("website"),
            )
            db.add(company)
            created += 1

    db.commit()

    return {
        "status": "success",
        "source": SEC_COMPANY_TICKERS_EXCHANGE_URL,
        "scanned": scanned,
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "duplicateCikSkipped": duplicate_cik_skipped,
        "limit": limit,
        "enrichProfile": enrich_profile,
    }
