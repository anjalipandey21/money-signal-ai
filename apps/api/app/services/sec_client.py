import logging
import random
import threading
import time
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import settings


SEC_SUBMISSIONS_BASE_URL = "https://data.sec.gov/submissions"
TRANSIENT_STATUS_CODES = {429, 500, 502, 503, 504}

logger = logging.getLogger(__name__)
_rate_limit_lock = threading.Lock()
_last_sec_request_at = 0.0
_user_agent_warning_logged = False


class SECClientError(Exception):
    pass


def normalize_cik(cik: str) -> str:
    digits = "".join(char for char in str(cik) if char.isdigit())

    if not digits:
        raise SECClientError("Invalid or missing CIK")

    return digits.zfill(10)


def _url_category(url: str) -> str:
    parsed = urlparse(url)

    if not parsed.netloc:
        return "unknown"

    path_parts = [part for part in parsed.path.split("/") if part]
    short_path = "/".join(path_parts[:4])

    return f"{parsed.netloc}/{short_path}" if short_path else parsed.netloc


def _warn_about_user_agent(user_agent: str) -> None:
    global _user_agent_warning_logged

    lowered = user_agent.lower()
    looks_generic = (
        not user_agent.strip()
        or "contact@example.com" in lowered
        or "your_email" in lowered
        or user_agent.strip().lower() in {"python-httpx", "python-requests"}
    )

    if looks_generic and not _user_agent_warning_logged:
        logger.warning(
            "SEC_USER_AGENT is missing or generic; set a production contact "
            "user-agent before deploying SEC ingestion."
        )
        _user_agent_warning_logged = True


def _sec_user_agent() -> str:
    user_agent = (settings.SEC_USER_AGENT or "").strip()

    if not user_agent:
        user_agent = "MoneySignalAI/0.1 contact@example.com"

    _warn_about_user_agent(user_agent)

    return user_agent


def get_sec_headers(accept: str = "application/json") -> dict[str, str]:
    return {
        "User-Agent": _sec_user_agent(),
        "Accept-Encoding": "gzip, deflate",
        "Accept": accept,
    }


def _rate_limit_sec_request() -> None:
    global _last_sec_request_at

    interval = max(0.0, settings.SEC_MIN_REQUEST_INTERVAL_SECONDS)

    if interval <= 0:
        return

    with _rate_limit_lock:
        now = time.monotonic()
        wait_seconds = interval - (now - _last_sec_request_at)

        if wait_seconds > 0:
            time.sleep(wait_seconds)

        _last_sec_request_at = time.monotonic()


def _request(
    method: str,
    url: str,
    *,
    request_kind: str,
    accept: str = "application/json",
    follow_redirects: bool = False,
) -> httpx.Response:
    max_retries = max(0, settings.SEC_MAX_RETRIES)
    timeout = max(1, settings.SEC_REQUEST_TIMEOUT_SECONDS)
    backoff_base = max(0.0, settings.SEC_BACKOFF_BASE_SECONDS)
    category = _url_category(url)
    last_error: Exception | None = None

    for attempt in range(1, max_retries + 2):
        _rate_limit_sec_request()
        started = time.perf_counter()

        try:
            with httpx.Client(
                timeout=timeout,
                headers=get_sec_headers(accept=accept),
                follow_redirects=follow_redirects,
            ) as client:
                response = client.request(method, url)

            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            logger.info(
                "SEC request kind=%s category=%s status=%s durationMs=%s attempt=%s",
                request_kind,
                category,
                response.status_code,
                duration_ms,
                attempt,
            )

            if response.status_code in TRANSIENT_STATUS_CODES:
                last_error = SECClientError(
                    f"SEC transient status {response.status_code} for {request_kind}"
                )

                if attempt <= max_retries:
                    _sleep_before_retry(attempt, backoff_base)
                    continue

            response.raise_for_status()

            return response

        except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as error:
            last_error = error
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            logger.warning(
                "SEC request failed kind=%s category=%s durationMs=%s attempt=%s "
                "errorType=%s error=%s",
                request_kind,
                category,
                duration_ms,
                attempt,
                type(error).__name__,
                str(error),
            )

            if attempt <= max_retries:
                _sleep_before_retry(attempt, backoff_base)
                continue

        except httpx.HTTPStatusError as error:
            last_error = error
            status_code = error.response.status_code

            if status_code in TRANSIENT_STATUS_CODES and attempt <= max_retries:
                _sleep_before_retry(attempt, backoff_base)
                continue

            logger.warning(
                "SEC request failed kind=%s category=%s status=%s attempt=%s",
                request_kind,
                category,
                status_code,
                attempt,
            )
            raise

        except httpx.HTTPError as error:
            last_error = error
            logger.warning(
                "SEC request failed kind=%s category=%s attempt=%s errorType=%s",
                request_kind,
                category,
                attempt,
                type(error).__name__,
            )
            raise

    raise SECClientError(f"SEC request failed for {request_kind}") from last_error


def _sleep_before_retry(attempt: int, backoff_base: float) -> None:
    if backoff_base <= 0:
        return

    jitter = random.uniform(0, min(0.25, backoff_base))
    sleep_seconds = min(10.0, backoff_base * (2 ** (attempt - 1)) + jitter)
    time.sleep(sleep_seconds)


def get_json(
    url: str,
    *,
    request_kind: str = "json",
    follow_redirects: bool = False,
) -> Any:
    response = _request(
        "GET",
        url,
        request_kind=request_kind,
        accept="application/json",
        follow_redirects=follow_redirects,
    )

    try:
        return response.json()
    except ValueError as error:
        raise SECClientError(f"SEC returned invalid JSON for {request_kind}") from error


def get_text(
    url: str,
    *,
    request_kind: str = "text",
    accept: str = "text/plain,*/*",
    follow_redirects: bool = False,
) -> str:
    response = _request(
        "GET",
        url,
        request_kind=request_kind,
        accept=accept,
        follow_redirects=follow_redirects,
    )

    return response.text


def get_bytes(
    url: str,
    *,
    request_kind: str = "bytes",
    accept: str = "application/octet-stream,*/*",
    follow_redirects: bool = False,
) -> bytes:
    response = _request(
        "GET",
        url,
        request_kind=request_kind,
        accept=accept,
        follow_redirects=follow_redirects,
    )

    return response.content


def get_company_submissions(cik: str) -> dict[str, Any]:
    normalized_cik = normalize_cik(cik)
    url = f"{SEC_SUBMISSIONS_BASE_URL}/CIK{normalized_cik}.json"

    try:
        return get_json(
            url,
            request_kind="company submissions",
        )

    except httpx.HTTPStatusError as error:
        raise SECClientError(
            f"SEC returned {error.response.status_code} for CIK {normalized_cik}"
        ) from error

    except SECClientError:
        raise

    except httpx.HTTPError as error:
        raise SECClientError(f"Failed to call SEC for CIK {normalized_cik}") from error


def get_recent_form4_filings(cik: str, limit: int = 10) -> list[dict[str, Any]]:
    normalized_cik = normalize_cik(cik)
    submissions = get_company_submissions(normalized_cik)

    recent = submissions.get("filings", {}).get("recent", {})

    forms = recent.get("form", [])
    accession_numbers = recent.get("accessionNumber", [])
    filing_dates = recent.get("filingDate", [])
    report_dates = recent.get("reportDate", [])
    primary_documents = recent.get("primaryDocument", [])

    filings: list[dict[str, Any]] = []

    cik_without_leading_zeroes = str(int(normalized_cik))

    for index, form_type in enumerate(forms):
        if form_type not in {"4", "4/A"}:
            continue

        accession_number = accession_numbers[index]
        accession_no_dashes = accession_number.replace("-", "")
        primary_document = primary_documents[index]

        base_url = (
            "https://www.sec.gov/Archives/edgar/data/"
            f"{cik_without_leading_zeroes}/"
            f"{accession_no_dashes}"
        )

        # SEC sometimes gives xslF345X06/form4.xml, which returns HTML.
        # For parsing, use the raw XML file at the accession root.
        raw_primary_document = primary_document.split("/")[-1]

        filing_url = f"{base_url}/{raw_primary_document}"
        viewer_url = f"{base_url}/{primary_document}"

        filings.append(
            {
                "formType": form_type,
                "accessionNumber": accession_number,
                "filingDate": filing_dates[index] if index < len(filing_dates) else None,
                "reportDate": report_dates[index] if index < len(report_dates) else None,
                "primaryDocument": raw_primary_document,
                "viewerDocument": primary_document,
                "filingUrl": filing_url,
                "viewerUrl": viewer_url,
            }
        )

        if len(filings) >= limit:
            break

    return filings


def get_filing_document(filing_url: str) -> str:
    try:
        text = get_text(
            filing_url,
            request_kind="filing document",
            accept="application/xml,text/xml,text/plain,*/*",
            follow_redirects=True,
        ).strip()

        if not text:
            raise SECClientError("SEC returned an empty filing document")

        preview = text[:500].lower()

        if "<html" in preview or "<!doctype html" in preview:
            raise SECClientError(
                "SEC returned HTML instead of XML for filing document"
            )

        return text

    except httpx.HTTPStatusError as error:
        raise SECClientError(
            f"SEC returned {error.response.status_code} for filing document"
        ) from error

    except SECClientError:
        raise

    except httpx.HTTPError as error:
        raise SECClientError("Failed to download SEC filing document") from error


def get_recent_13f_filings(cik: str, limit: int = 5) -> list[dict[str, Any]]:
    normalized_cik = normalize_cik(cik)
    submissions = get_company_submissions(normalized_cik)

    recent = submissions.get("filings", {}).get("recent", {})

    forms = recent.get("form", [])
    accession_numbers = recent.get("accessionNumber", [])
    filing_dates = recent.get("filingDate", [])
    report_dates = recent.get("reportDate", [])
    primary_documents = recent.get("primaryDocument", [])

    filings: list[dict[str, Any]] = []

    cik_without_leading_zeroes = str(int(normalized_cik))

    for index, form_type in enumerate(forms):
        if form_type not in {"13F-HR", "13F-HR/A"}:
            continue

        accession_number = accession_numbers[index]
        accession_no_dashes = accession_number.replace("-", "")
        primary_document = primary_documents[index]

        base_url = (
            "https://www.sec.gov/Archives/edgar/data/"
            f"{cik_without_leading_zeroes}/"
            f"{accession_no_dashes}"
        )

        filings.append(
            {
                "formType": form_type,
                "accessionNumber": accession_number,
                "filingDate": filing_dates[index] if index < len(filing_dates) else None,
                "reportDate": report_dates[index] if index < len(report_dates) else None,
                "primaryDocument": primary_document,
                "filingUrl": f"{base_url}/{primary_document}",
                "filingIndexUrl": f"{base_url}/index.json",
                "baseUrl": base_url,
            }
        )

        if len(filings) >= limit:
            break

    return filings


def get_filing_index(filing_index_url: str) -> dict[str, Any]:
    try:
        return get_json(
            filing_index_url,
            request_kind="filing index",
            follow_redirects=True,
        )

    except httpx.HTTPStatusError as error:
        raise SECClientError(
            f"SEC returned {error.response.status_code} for filing index"
        ) from error

    except SECClientError:
        raise

    except httpx.HTTPError as error:
        raise SECClientError("Failed to download SEC filing index") from error


def get_13f_information_table_document(filing: dict[str, Any]) -> tuple[str, str]:
    index = get_filing_index(filing["filingIndexUrl"])
    items = index.get("directory", {}).get("item", [])

    xml_candidates = []

    for item in items:
        name = item.get("name", "")
        lower_name = name.lower()

        if not lower_name.endswith(".xml"):
            continue

        if "xsl" in lower_name:
            continue

        score = 0

        if "infotable" in lower_name:
            score += 10
        if "information" in lower_name:
            score += 8
        if "13f" in lower_name:
            score += 5

        xml_candidates.append(
            {
                "name": name,
                "score": score,
                "url": f"{filing['baseUrl']}/{name}",
            }
        )

    xml_candidates.sort(key=lambda item: item["score"], reverse=True)

    errors = []

    for candidate in xml_candidates:
        try:
            document_text = get_filing_document(candidate["url"])

            lower_text = document_text.lower()

            if "<informationtable" in lower_text or "<infotable" in lower_text:
                return candidate["url"], document_text

            errors.append(
                {
                    "url": candidate["url"],
                    "error": "XML file did not look like a 13F information table",
                }
            )

        except Exception as error:
            errors.append(
                {
                    "url": candidate["url"],
                    "error": str(error),
                }
            )

    raise SECClientError(
        f"Could not find 13F information table XML. Candidates checked: {errors}"
    )
