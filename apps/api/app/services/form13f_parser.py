from __future__ import annotations

import xml.etree.ElementTree as ET
from typing import Any


class Form13FParserError(Exception):
    pass


def _strip_namespace(element: ET.Element) -> None:
    for node in element.iter():
        if "}" in node.tag:
            node.tag = node.tag.split("}", 1)[1]


def _text(parent: ET.Element | None, path: str) -> str | None:
    if parent is None:
        return None

    element = parent.find(path)

    if element is None or element.text is None:
        return None

    return element.text.strip()


def _int(value: str | None) -> int | None:
    if value in (None, ""):
        return None

    try:
        cleaned = value.replace(",", "").replace("$", "").strip()
        return int(float(cleaned))
    except ValueError:
        return None


def _warning_list(*items: str | None) -> list[str]:
    return [item for item in items if item]


def _parse_holding(info_table: ET.Element) -> dict[str, Any]:
    value_thousands = _int(_text(info_table, "value"))
    value_usd = value_thousands * 1000 if value_thousands is not None else None
    shares = _int(_text(info_table, "shrsOrPrnAmt/sshPrnamt"))
    issuer_name = _text(info_table, "nameOfIssuer")
    cusip = _text(info_table, "cusip")

    voting = info_table.find("votingAuthority")
    warnings = _warning_list(
        "missing_issuer" if not issuer_name else None,
        "missing_cusip" if not cusip else None,
        "missing_value" if value_thousands is None else None,
        "missing_shares" if shares is None else None,
    )

    return {
        "issuerName": issuer_name,
        "titleOfClass": _text(info_table, "titleOfClass"),
        "cusip": cusip,
        "valueThousands": value_thousands,
        "valueUsd": value_usd,
        "shares": shares,
        "shareType": _text(info_table, "shrsOrPrnAmt/sshPrnamtType"),
        "putCall": _text(info_table, "putCall"),
        "investmentDiscretion": _text(info_table, "investmentDiscretion"),
        "votingSole": _int(_text(voting, "Sole")),
        "votingShared": _int(_text(voting, "Shared")),
        "votingNone": _int(_text(voting, "None")),
        "validationWarnings": warnings,
    }


def parse_13f_information_table(xml_text: str, filing_url: str | None = None) -> dict[str, Any]:
    text = xml_text.lstrip("\ufeff").strip()

    if not text:
        raise Form13FParserError("SEC returned an empty 13F information table")

    try:
        root = ET.fromstring(text)
    except ET.ParseError as error:
        preview = text[:300].replace("\n", " ").replace("\r", " ")
        raise Form13FParserError(
            f"Invalid 13F information table XML: {error}. Preview: {preview}"
        ) from error

    _strip_namespace(root)

    holdings = []
    validation_warnings: list[str] = []
    info_tables = root.findall(".//infoTable")

    if not info_tables:
        raise Form13FParserError("Could not find 13F infoTable rows in SEC response")

    for info_table in info_tables:
        holding = _parse_holding(info_table)
        validation_warnings.extend(holding.get("validationWarnings", []))

        holdings.append(holding)

    total_value_usd = sum(
        holding["valueUsd"] or 0
        for holding in holdings
    )

    return {
        "filingUrl": filing_url,
        "holdingCount": len(holdings),
        "totalValueUsd": total_value_usd,
        "holdings": holdings,
        "validationWarnings": validation_warnings,
        "validationWarningCount": len(validation_warnings),
    }
