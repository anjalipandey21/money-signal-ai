import argparse
import sys
import time
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_ROOT))

from app.db.database import SessionLocal
from app.models import Company
from app.services.market_data_service import MarketDataError, refresh_market_snapshot


def parse_symbols(raw_symbols: str | None):
    if not raw_symbols:
        return None

    return [
        symbol.strip().upper()
        for symbol in raw_symbols.split(",")
        if symbol.strip()
    ]


def get_tracked_symbols(db, requested_symbols: list[str] | None):
    query = db.query(Company.ticker).order_by(Company.ticker.asc())

    if requested_symbols:
        query = query.filter(Company.ticker.in_(requested_symbols))

    return [row[0] for row in query.all()]


def refresh_symbols(symbols: list[str], sleep_seconds: int):
    success_count = 0
    failure_count = 0

    for index, symbol in enumerate(symbols, start=1):
        db = SessionLocal()

        try:
            print(f"[{index}/{len(symbols)}] Refreshing {symbol}...")

            snapshot = refresh_market_snapshot(db, symbol)

            print(
                f"SUCCESS {symbol}: "
                f"price={snapshot.price}, "
                f"change={snapshot.change_amount}, "
                f"change_percent={snapshot.change_percent}, "
                f"fetched_at={snapshot.fetched_at}"
            )

            success_count += 1

        except MarketDataError as error:
            db.rollback()
            failure_count += 1
            print(f"SKIPPED {symbol}: {error}")

        except Exception as error:
            db.rollback()
            failure_count += 1
            print(f"FAILED {symbol}: {type(error).__name__}: {error}")

        finally:
            db.close()

        if index < len(symbols):
            print(f"Waiting {sleep_seconds} seconds before next request...")
            time.sleep(sleep_seconds)

    print("")
    print("Refresh complete.")
    print(f"Successful: {success_count}")
    print(f"Failed/skipped: {failure_count}")


def main():
    parser = argparse.ArgumentParser(
        description="Refresh latest market snapshots for tracked stocks."
    )

    parser.add_argument(
        "--symbols",
        help="Comma-separated tickers to refresh, example: NVDA,AAPL,MSFT",
    )

    parser.add_argument(
        "--sleep",
        type=int,
        default=15,
        help="Seconds to wait between provider API calls.",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of tickers to refresh.",
    )

    args = parser.parse_args()

    requested_symbols = parse_symbols(args.symbols)

    db = SessionLocal()

    try:
        symbols = get_tracked_symbols(db, requested_symbols)

        if args.limit:
            symbols = symbols[: args.limit]

    finally:
        db.close()

    if not symbols:
        print("No matching tracked symbols found.")
        return

    print(f"Refreshing {len(symbols)} symbols: {', '.join(symbols)}")
    print("")

    refresh_symbols(symbols, args.sleep)


if __name__ == "__main__":
    main()