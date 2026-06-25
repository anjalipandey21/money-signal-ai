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
        return int(float(value.replace(",", "")))
    except ValueError:
        return None


def _parse_holding(info_table: ET.Element) -> dict[str, Any]:
    value_thousands = _int(_text(info_table, "value"))
    value_usd = value_thousands * 1000 if value_thousands is not None else None

    voting = info_table.find("votingAuthority")

    return {
        "issuerName": _text(info_table, "nameOfIssuer"),
        "titleOfClass": _text(info_table, "titleOfClass"),
        "cusip": _text(info_table, "cusip"),
        "valueThousands": value_thousands,
        "valueUsd": value_usd,
        "shares": _int(_text(info_table, "shrsOrPrnAmt/sshPrnamt")),
        "shareType": _text(info_table, "shrsOrPrnAmt/sshPrnamtType"),
        "putCall": _text(info_table, "putCall"),
        "investmentDiscretion": _text(info_table, "investmentDiscretion"),
        "votingSole": _int(_text(voting, "Sole")),
        "votingShared": _int(_text(voting, "Shared")),
        "votingNone": _int(_text(voting, "None")),
    }


def parse_13f_information_table(xml_text: str, filing_url: str | None = None) -> dict[str, Any]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as error:
        preview = xml_text[:500].replace("\n", " ").replace("\r", " ")
        raise Form13FParserError(
            f"Invalid 13F information table XML: {error}. Preview: {preview}"
        ) from error

    _strip_namespace(root)

    holdings = []

    for info_table in root.findall(".//infoTable"):
        holding = _parse_holding(info_table)

        if holding["issuerName"] or holding["cusip"]:
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
    }