from typing import Any

import httpx

from app.core.config import settings


SEC_SUBMISSIONS_BASE_URL = "https://data.sec.gov/submissions"


class SECClientError(Exception):
    pass


def normalize_cik(cik: str) -> str:
    digits = "".join(char for char in str(cik) if char.isdigit())

    if not digits:
        raise SECClientError("Invalid or missing CIK")

    return digits.zfill(10)


def get_sec_headers() -> dict[str, str]:
    return {
        "User-Agent": settings.SEC_USER_AGENT,
        "Accept-Encoding": "gzip, deflate",
        "Accept": "application/json",
    }


def get_company_submissions(cik: str) -> dict[str, Any]:
    normalized_cik = normalize_cik(cik)
    url = f"{SEC_SUBMISSIONS_BASE_URL}/CIK{normalized_cik}.json"

    try:
        with httpx.Client(
            timeout=settings.SEC_REQUEST_TIMEOUT_SECONDS,
            headers=get_sec_headers(),
        ) as client:
            response = client.get(url)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as error:
        raise SECClientError(
            f"SEC returned {error.response.status_code} for CIK {normalized_cik}"
        ) from error

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
        with httpx.Client(
            timeout=settings.SEC_REQUEST_TIMEOUT_SECONDS,
            headers={
                **get_sec_headers(),
                "Accept": "application/xml,text/xml,text/plain,*/*",
            },
            follow_redirects=True,
        ) as client:
            response = client.get(filing_url)
            response.raise_for_status()

            text = response.text.strip()

            if not text:
                raise SECClientError("SEC returned an empty filing document")

            preview = text[:500].lower()

            if "<html" in preview or "<!doctype html" in preview:
                raise SECClientError(
                    f"SEC returned HTML instead of XML for {filing_url}"
                )

            return text

    except httpx.HTTPStatusError as error:
        raise SECClientError(
            f"SEC returned {error.response.status_code} for filing document"
        ) from error

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
        with httpx.Client(
            timeout=settings.SEC_REQUEST_TIMEOUT_SECONDS,
            headers=get_sec_headers(),
            follow_redirects=True,
        ) as client:
            response = client.get(filing_index_url)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as error:
        raise SECClientError(
            f"SEC returned {error.response.status_code} for filing index"
        ) from error

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