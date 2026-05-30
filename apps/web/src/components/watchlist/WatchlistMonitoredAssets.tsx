"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useWatchlistAssets } from "@/hooks/useWatchlistAssets";
import type { WatchlistAsset } from "@/lib/moneySignalApi";

function signalStyle(direction: WatchlistAsset["direction"]) {
  if (direction === "bullish") {
    return "border-[#4edea3]/30 bg-[#00a572]/20 text-[#4edea3]";
  }

  if (direction === "bearish") {
    return "border-[#ffb4ab]/30 bg-[#93000a]/20 text-[#ffb4ab]";
  }

  if (direction === "mixed") {
    return "border-[#ddb7ff]/30 bg-[#6f00be]/20 text-[#ddb7ff]";
  }

  return "border-[#424754]/60 bg-[#262a32] text-[#c2c6d6]";
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

function scoreDeltaColor(asset: WatchlistAsset) {
  if (asset.direction === "bullish") return "text-[#4edea3]";
  if (asset.direction === "bearish") return "text-[#ffb4ab]";
  return "text-[#c2c6d6]";
}

export function WatchlistMonitoredAssets() {
  const { data, isLoading, isUsingFallback } = useWatchlistAssets();

  return (
    <div className="relative overflow-hidden rounded-lg border border-[#1E293B] bg-[#111722] transition-all">
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#A855F7]/50 to-transparent" />

      <div className="flex items-center justify-between border-b border-[#1E293B] px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
            Monitored Assets
          </h3>

          <span
            className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
              isUsingFallback
                ? "border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]"
                : "border border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]"
            }`}
          >
            {isLoading ? "Loading" : isUsingFallback ? "Fallback" : "Live"}
          </span>
        </div>

        <button className="flex items-center gap-1 text-[13px] text-[#c2c6d6] transition-colors hover:text-[#adc6ff]">
          <MaterialIcon name="filter_list" className="text-[16px]" />
          Filter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-[#1E293B]">
              <th className="w-[80px] px-2 py-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Ticker
              </th>
              <th className="px-2 py-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Company
              </th>
              <th className="w-[120px] px-2 py-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Sector
              </th>
              <th className="w-[95px] px-2 py-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Price
              </th>
              <th className="w-[140px] px-2 py-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                MoneySignal Score
              </th>
              <th className="px-2 py-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Latest Signal
              </th>
              <th className="w-[90px] px-2 py-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Updated
              </th>
              <th className="w-[80px] px-2 py-3 text-right font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1E293B]/80">
            {data.map((asset) => (
              <tr
                key={asset.ticker}
                className="group transition-colors hover:bg-[#181c23]"
              >
                <td className="px-2 py-4">
                  <Link
                    href={`/stocks/${asset.ticker}`}
                    className="inline-block rounded border border-[#424754] bg-[#10131b] px-2 py-1 font-mono text-[13px] text-[#e0e2ed] transition-colors hover:border-[#adc6ff] hover:text-[#adc6ff]"
                  >
                    {asset.ticker}
                  </Link>
                </td>

                <td className="whitespace-normal px-2 py-4 text-[14px] font-medium text-[#e0e2ed]">
                  {asset.companyName}
                </td>

                <td className="px-2 py-4 text-[13px] text-[#c2c6d6]">
                  {asset.sector}
                </td>

                <td className="px-2 py-4 font-mono text-[13px] text-[#e0e2ed]">
                  {asset.price}
                </td>

                <td className="px-2 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[14px] text-[#e0e2ed]">
                      {asset.score}
                    </span>

                    <span
                      className={`flex items-center text-[11px] ${scoreDeltaColor(
                        asset
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

                <td className="whitespace-normal px-2 py-4">
                  <span
                    className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${signalStyle(
                      asset.direction
                    )}`}
                  >
                    {asset.signal}
                  </span>
                </td>

                <td className="px-2 py-4 font-mono text-[12px] text-[#c2c6d6]">
                  {asset.lastUpdated}
                </td>

                <td className="px-2 py-4 text-right">
                  <Link
                    href={`/stocks/${asset.ticker}`}
                    className="flex w-full items-center justify-end gap-1 text-[13px] text-[#c2c6d6] transition-colors group-hover:text-[#adc6ff]"
                  >
                    View
                    <MaterialIcon name="chevron_right" className="text-[16px]" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}