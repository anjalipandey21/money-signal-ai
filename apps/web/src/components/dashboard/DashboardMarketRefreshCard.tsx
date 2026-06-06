"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  formatFreshnessLabel,
  refreshMarketSnapshot,
  type MarketSnapshotResponse,
} from "@/lib/moneySignalApi";

export function DashboardMarketRefreshCard() {
  const [ticker, setTicker] = useState("NVDA");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState<MarketSnapshotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    const cleanTicker = ticker.trim().toUpperCase();

    if (!cleanTicker) {
      setError("Enter a ticker first.");
      return;
    }

    try {
      setIsRefreshing(true);
      setError(null);
      setResult(null);

      const response = await refreshMarketSnapshot(cleanTicker);

      setResult(response);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh market snapshot."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded border border-[#424754]/50 bg-[#0a0e16] p-5">
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#4edea3]/70 to-transparent" />

      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded border border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]">
          <MaterialIcon name="sync" className="text-[22px]" />
        </div>

        <div>
          <h3 className="text-[18px] font-semibold text-[#e0e2ed]">
            Refresh Market Snapshot
          </h3>

          <p className="mt-1 text-[13px] leading-5 text-[#8c909f]">
            Fetch latest price data from the backend provider and save it into
            the database.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={ticker}
          onChange={(event) => setTicker(event.target.value.toUpperCase())}
          placeholder="NVDA"
          className="min-w-0 flex-1 rounded border border-[#424754]/60 bg-[#111620] px-3 py-2 font-mono text-[13px] uppercase text-[#e0e2ed] outline-none transition-colors placeholder:text-[#5c6270] focus:border-[#4edea3]/70"
        />

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded border border-[#4edea3]/40 bg-[#4edea3]/10 px-4 py-2 font-mono text-[12px] uppercase tracking-wider text-[#4edea3] transition-colors hover:bg-[#4edea3]/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MaterialIcon
            name={isRefreshing ? "hourglass_top" : "refresh"}
            className="text-[16px]"
          />
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 p-3 text-[13px] leading-5 text-[#ffb4ab]">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded border border-[#424754]/40 bg-[#111620] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[13px] font-bold uppercase text-[#e0e2ed]">
                {result.ticker}
              </p>

              <p className="mt-1 text-[24px] font-semibold text-[#e0e2ed]">
                {result.price}
              </p>
            </div>

            <div className="text-right">
              <p
                className={`font-mono text-[13px] ${
                  result.changePercent.startsWith("-")
                    ? "text-[#ffb4ab]"
                    : "text-[#4edea3]"
                }`}
              >
                {result.changeAmount} ({result.changePercent})
              </p>

              <p className="mt-2 max-w-[180px] font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
                {formatFreshnessLabel(
                  result.priceFetchedAt,
                  result.marketProvider
                )}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-[12px] leading-5 text-[#8c909f]">
        Note: free market-data APIs may have daily/rate limits, so refresh only
        the symbols you need during local testing.
      </p>
    </div>
  );
}