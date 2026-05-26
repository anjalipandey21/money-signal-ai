"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useSignalsFeed } from "@/hooks/useSignalsFeed";
import type { SignalItem } from "@/lib/moneySignalApi";

function eventBadgeStyle(direction: SignalItem["direction"]) {
  if (direction === "bullish") {
    return "border-[#4edea3]/20 bg-[#00a572]/20 text-[#4edea3]";
  }

  if (direction === "bearish") {
    return "border-[#ffb4ab]/20 bg-[#93000a]/20 text-[#ffb4ab]";
  }

  if (direction === "mixed") {
    return "border-[#ddb7ff]/20 bg-[#6f00be]/20 text-[#ddb7ff]";
  }

  return "border-[#424754]/50 bg-[#262a32] text-[#e0e2ed]";
}

function rowBorderStyle(direction: SignalItem["direction"]) {
  if (direction === "bullish") return "border-l-[#4edea3]";
  if (direction === "bearish") return "border-l-[#ffb4ab]";
  if (direction === "mixed") return "border-l-[#ddb7ff]";
  return "border-l-[#424754]";
}

function scoreColor(direction: SignalItem["direction"]) {
  if (direction === "bullish") return "text-[#4edea3]";
  if (direction === "bearish") return "text-[#ffb4ab]";
  if (direction === "mixed") return "text-[#ddb7ff]";
  return "text-[#e0e2ed]";
}

export function SignalsFeedList() {
  const { data, isLoading, isUsingFallback } = useSignalsFeed();

  return (
    <div className="overflow-hidden rounded-lg border border-[#424754]/30 bg-[#0a0e16] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#424754]/30 bg-[#181c23]/50">
              <th className="w-[100px] px-4 py-3 font-mono text-[12px] font-medium tracking-wider text-[#c2c6d6]">
                TICKER
              </th>
              <th className="w-[190px] px-4 py-3 font-mono text-[12px] font-medium tracking-wider text-[#c2c6d6]">
                SIGNAL EVENT
              </th>
              <th className="w-[80px] px-4 py-3 text-right font-mono text-[12px] font-medium tracking-wider text-[#c2c6d6]">
                SCORE
              </th>
              <th className="w-[80px] px-4 py-3 text-right font-mono text-[12px] font-medium tracking-wider text-[#c2c6d6]">
                CONF.
              </th>
              <th className="w-[130px] px-4 py-3 font-mono text-[12px] font-medium tracking-wider text-[#c2c6d6]">
                SOURCE
              </th>
              <th className="px-4 py-3 font-mono text-[12px] font-medium tracking-wider text-[#c2c6d6]">
                AI CONTEXT
              </th>
              <th className="w-[100px] px-4 py-3 text-right font-mono text-[12px] font-medium tracking-wider text-[#c2c6d6]">
                TIME
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#424754]/20 font-mono text-[14px]">
            {data.map((signal) => (
              <tr
                key={signal.id}
                className={`group cursor-pointer border-l-2 transition-colors hover:bg-[#181c23]/70 ${rowBorderStyle(
                  signal.direction
                )}`}
              >
                <td className="px-4 py-4 align-top">
                  <Link
                    href={`/stocks/${signal.ticker}`}
                    className="flex items-center gap-2 font-bold text-[#e0e2ed]"
                  >
                    {signal.ticker}
                    <MaterialIcon
                      name="open_in_new"
                      className="text-[14px] text-[#4edea3] opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </Link>
                </td>

                <td className="px-4 py-4 align-top">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${eventBadgeStyle(
                      signal.direction
                    )}`}
                  >
                    {signal.signalEvent}
                  </span>
                </td>

                <td
                  className={`px-4 py-4 text-right align-top font-bold ${scoreColor(
                    signal.direction
                  )}`}
                >
                  {signal.score}
                </td>

                <td className="px-4 py-4 text-right align-top text-[#c2c6d6]">
                  {signal.confidence}%
                </td>

                <td className="px-4 py-4 align-top text-[13px] text-[#c2c6d6]">
                  {signal.source}
                </td>

                <td className="px-4 py-4 align-top text-[13px] leading-relaxed text-[#c2c6d6] transition-colors group-hover:text-[#e0e2ed]">
                  {signal.aiContext}
                </td>

                <td className="px-4 py-4 text-right align-top text-[12px] text-[#8c909f]">
                  {signal.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#424754]/30 bg-[#181c23]/30 p-4">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#c2c6d6]">
            Showing 1-{data.length} of 1,204 signals
          </span>

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

        <div className="flex gap-2">
          <button
            disabled
            className="rounded border border-[#424754]/50 bg-[#1c2027] px-3 py-1 text-[13px] text-[#8c909f] opacity-50"
          >
            Prev
          </button>

          <button className="rounded border border-[#424754]/50 bg-[#1c2027] px-3 py-1 text-[13px] text-[#c2c6d6] transition-colors hover:border-[#8c909f] hover:text-[#e0e2ed]">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}