from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from typing import Any


class Form4ParserError(Exception):
    pass


def _text(parent: ET.Element | None, path: str) -> str | None:
    if parent is None:
        return None

    element = parent.find(path)

    if element is None or element.text is None:
        return None

    return element.text.strip()


def _float(value: str | None) -> float | None:
    if value in (None, ""):
        return None

    try:
        return float(value.replace(",", ""))
    except ValueError:
        return None


def _bool(value: str | None) -> bool:
    return str(value).lower() in {"1", "true", "yes"}


def _transaction_type(code: str | None) -> str:
    if code == "P":
        return "BUY"
    if code == "S":
        return "SELL"
    if code in {"A", "M"}:
        return "AWARD_OR_EXERCISE"
    if code == "G":
        return "GIFT"
    return "OTHER"


def _parse_owner(owner_node: ET.Element | None) -> dict[str, Any]:
    relationship = (
        owner_node.find("reportingOwnerRelationship")
        if owner_node is not None
        else None
    )

    return {
        "ownerName": _text(owner_node, "reportingOwnerId/rptOwnerName"),
        "ownerCik": _text(owner_node, "reportingOwnerId/rptOwnerCik"),
        "isDirector": _bool(_text(relationship, "isDirector")),
        "isOfficer": _bool(_text(relationship, "isOfficer")),
        "isTenPercentOwner": _bool(_text(relationship, "isTenPercentOwner")),
        "officerTitle": _text(relationship, "officerTitle"),
    }


def _parse_transaction(transaction_node: ET.Element, derivative: bool = False) -> dict[str, Any]:
    transaction_code = _text(
        transaction_node,
        "transactionCoding/transactionCode",
    )

    shares = _float(
        _text(transaction_node, "transactionAmounts/transactionShares/value")
    )

    price_per_share = _float(
        _text(transaction_node, "transactionAmounts/transactionPricePerShare/value")
    )

    total_value = None
    if shares is not None and price_per_share is not None:
        total_value = round(shares * price_per_share, 2)

    return {
        "transactionDate": _text(transaction_node, "transactionDate/value"),
        "transactionCode": transaction_code,
        "transactionType": _transaction_type(transaction_code),
        "shares": shares,
        "pricePerShare": price_per_share,
        "totalValue": total_value,
        "sharesOwnedAfter": _float(
            _text(
                transaction_node,
                "postTransactionAmounts/sharesOwnedFollowingTransaction/value",
            )
        ),
        "ownershipType": _text(
            transaction_node,
            "ownershipNature/directOrIndirectOwnership/value",
        ),
        "derivativeTransaction": derivative,
    }


def parse_form4_xml(xml_text: str, filing_url: str | None = None) -> dict[str, Any]:
    document_xml = _extract_ownership_document(xml_text)

    try:
        root = ET.fromstring(document_xml)
    except ET.ParseError as error:
        preview = document_xml[:500].replace("\n", " ").replace("\r", " ")
        raise Form4ParserError(
            f"Invalid Form 4 XML document: {error}. Preview: {preview}"
        ) from error

    issuer = root.find("issuer")
    owner_node = root.find("reportingOwner")

    transactions: list[dict[str, Any]] = []

    for transaction_node in root.findall("nonDerivativeTable/nonDerivativeTransaction"):
        transactions.append(_parse_transaction(transaction_node, derivative=False))

    for transaction_node in root.findall("derivativeTable/derivativeTransaction"):
        transactions.append(_parse_transaction(transaction_node, derivative=True))

    return {
        "issuer": {
            "issuerCik": _text(issuer, "issuerCik"),
            "issuerName": _text(issuer, "issuerName"),
            "issuerTradingSymbol": _text(issuer, "issuerTradingSymbol"),
        },
        "reportingOwner": _parse_owner(owner_node),
        "periodOfReport": _text(root, "periodOfReport"),
        "documentType": _text(root, "documentType"),
        "filingUrl": filing_url,
        "transactionCount": len(transactions),
        "transactions": transactions,
    }

def _extract_ownership_document(raw_text: str) -> str:
    text = raw_text.lstrip("\ufeff").strip()

    if not text:
        raise Form4ParserError("SEC returned an empty filing document")

    # Case 1: SEC SGML response with <XML>...</XML> blocks
    xml_blocks = re.findall(r"<XML>(.*?)</XML>", text, flags=re.IGNORECASE | re.DOTALL)

    for block in xml_blocks:
        if "<ownershipDocument" in block:
            return block.strip()

    # Case 2: raw ownershipDocument inside a bigger response
    start = text.find("<ownershipDocument")
    end = text.find("</ownershipDocument>")

    if start != -1 and end != -1:
        end += len("</ownershipDocument>")
        return text[start:end].strip()

    # Case 3: clean XML document
    if text.startswith("<?xml") or text.startswith("<ownershipDocument"):
        return text

    preview = text[:500].replace("\n", " ").replace("\r", " ")
    raise Form4ParserError(
        f"Could not find ownershipDocument in SEC response. Preview: {preview}"
    )