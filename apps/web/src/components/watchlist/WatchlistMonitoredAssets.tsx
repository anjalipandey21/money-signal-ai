"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useWatchlistAssets } from "@/hooks/useWatchlistAssets";
import {
  removeWatchlistStock,
  type WatchlistAsset,
} from "@/lib/moneySignalApi";

function signalStyle(direction: WatchlistAsset["direction"]) {
  if (direction === "bullish") {
    return "border-[#4edea3]/30 bg-[#003d2f] text-[#4edea3]";
  }

  if (direction === "bearish") {
    return "border-[#ffb4ab]/30 bg-[#3b1115] text-[#ffb4ab]";
  }

  if (direction === "mixed") {
    return "border-[#ddb7ff]/30 bg-[#2a163d] text-[#ddb7ff]";
  }

  return "border-[#5c6270]/50 bg-[#262a32] text-[#c2c6d6]";
}

function scoreColor(direction: WatchlistAsset["direction"]) {
  if (direction === "bullish") return "text-[#4edea3]";
  if (direction === "bearish") return "text-[#ffb4ab]";
  if (direction === "mixed") return "text-[#ddb7ff]";
  return "text-[#e0e2ed]";
}

function scoreDelta(asset: WatchlistAsset) {
  if (asset.direction === "bullish") return "+4.1";
  if (asset.direction === "bearish") return "-2.1";
  if (asset.direction === "mixed") return "-1.0";
  return "0.0";
}

function scoreDeltaIcon(asset: WatchlistAsset) {
  if (asset.direction === "bullish") return "trending_up";
  if (asset.direction === "bearish") return "trending_down";
  return "remove";
}

function EmptyWatchlist() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
      <MaterialIcon
        name="star"
        className="mb-3 text-[42px] text-[#5c6270]"
      />

      <h3 className="text-[18px] font-semibold text-[#e0e2ed]">
        No monitored assets yet
      </h3>

      <p className="mt-2 max-w-md text-[14px] leading-6 text-[#8c909f]">
        Add a stock to begin monitoring institutional activity, insider trades,
        score changes, and AI-generated money movement signals.
      </p>
    </div>
  );
}

export function WatchlistMonitoredAssets() {
  const { data, isLoading, isUsingFallback } = useWatchlistAssets();
  const [removingTicker, setRemovingTicker] = useState<string | null>(null);
  const [removedTickers, setRemovedTickers] = useState<string[]>([]);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const visibleData = useMemo(() => {
    return data.filter((asset) => !removedTickers.includes(asset.ticker));
  }, [data, removedTickers]);

  async function handleRemove(ticker: string) {
    const confirmed = window.confirm(`Remove ${ticker} from your watchlist?`);

    if (!confirmed) return;

    try {
      setRemovingTicker(ticker);
      setRemoveError(null);

      await removeWatchlistStock(ticker);

      setRemovedTickers((current) => [...current, ticker]);
    } catch (error) {
      setRemoveError(
        error instanceof Error
          ? error.message
          : "Unable to remove stock right now."
      );
    } finally {
      setRemovingTicker(null);
    }
  }

  return (
    <div className="relative overflow-hidden rounded border border-[#424754]/40 bg-[#0a0e16]">
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#A855F7]/60 to-transparent" />

      <div className="flex items-center justify-between border-b border-[#424754]/40 bg-[#111620] px-4 py-4">
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.18em] text-[#c2c6d6]">
            Monitored Assets
          </h3>

          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
              isUsingFallback
                ? "border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]"
                : "border border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]"
            }`}
          >
            {isLoading ? "Loading" : isUsingFallback ? "Fallback" : "Live"}
          </span>
        </div>

        <button className="flex items-center gap-1 text-[13px] text-[#c2c6d6] transition-colors hover:text-[#adc6ff]">
          <MaterialIcon name="filter_list" className="text-[17px]" />
          Filter
        </button>
      </div>

      {removeError ? (
        <div className="border-b border-[#ffb4ab]/30 bg-[#ffb4ab]/10 px-4 py-2 text-sm text-[#ffb4ab]">
          {removeError}
        </div>
      ) : null}

      {visibleData.length === 0 ? (
        <EmptyWatchlist />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#424754]/40">
                <th className="w-[90px] px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                  Ticker
                </th>

                <th className="w-[190px] px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                  Company
                </th>

                <th className="w-[150px] px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                  Sector
                </th>

                <th className="w-[110px] px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                  Price
                </th>

                <th className="w-[160px] px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                  MoneySignal Score
                </th>

                <th className="px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                  Latest Signal
                </th>

                <th className="w-[120px] px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                  Updated
                </th>

                <th className="w-[150px] px-4 py-4 text-right font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#424754]/25">
              {visibleData.map((asset) => (
                <tr
                  key={asset.ticker}
                  className="group bg-[#0a0e16] transition-colors hover:bg-[#121722]"
                >
                  <td className="px-4 py-5 align-top">
                    <Link
                      href={`/stocks/${asset.ticker}`}
                      className="inline-flex rounded border border-[#424754] bg-[#10131b] px-2.5 py-1 font-mono text-[13px] font-bold uppercase text-[#e0e2ed] transition-colors hover:border-[#adc6ff] hover:text-[#adc6ff]"
                    >
                      {asset.ticker}
                    </Link>
                  </td>

                  <td className="px-4 py-5 align-top">
                    <p className="text-[14px] font-semibold leading-5 text-[#e0e2ed]">
                      {asset.companyName}
                    </p>
                  </td>

                  <td className="px-4 py-5 align-top text-[13px] leading-5 text-[#c2c6d6]">
                    {asset.sector}
                  </td>

                  <td className="px-4 py-5 align-top">
                    <p className="font-mono text-[14px] font-semibold text-[#e0e2ed]">
                      {asset.price}
                    </p>
                     <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
                      {asset.freshnessLabel}
                    </p>

                    <p
                      className={`mt-1 font-mono text-[11px] ${
                        asset.change.startsWith("-")
                          ? "text-[#ffb4ab]"
                          : "text-[#4edea3]"
                      }`}
                    >
                      {asset.change}
                    </p>
                  </td>

                  <td className="px-4 py-5 align-top">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[16px] font-bold ${scoreColor(
                          asset.direction
                        )}`}
                      >
                        {asset.score}
                      </span>

                      <span
                        className={`flex items-center gap-0.5 font-mono text-[11px] ${scoreColor(
                          asset.direction
                        )}`}
                      >
                        <MaterialIcon
                          name={scoreDeltaIcon(asset)}
                          className="text-[14px]"
                        />
                        {scoreDelta(asset)}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-5 align-top">
                    <span
                      className={`inline-flex max-w-[240px] items-center rounded border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] ${signalStyle(
                        asset.direction
                      )}`}
                    >
                      {asset.signal}
                    </span>
                  </td>

                  <td className="px-4 py-5 align-top font-mono text-[12px] text-[#8c909f]">
                    {asset.lastUpdated}
                  </td>

                  <td className="px-4 py-5 text-right align-top">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/stocks/${asset.ticker}`}
                        className="flex items-center gap-1 text-[13px] text-[#c2c6d6] transition-colors hover:text-[#adc6ff]"
                      >
                        View
                        <MaterialIcon
                          name="chevron_right"
                          className="text-[16px]"
                        />
                      </Link>

                      <button
                        type="button"
                        disabled={removingTicker === asset.ticker}
                        onClick={() => handleRemove(asset.ticker)}
                        className="flex items-center gap-1 text-[13px] text-[#ffb4ab] transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <MaterialIcon name="delete" className="text-[15px]" />
                        {removingTicker === asset.ticker
                          ? "Removing"
                          : "Remove"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}