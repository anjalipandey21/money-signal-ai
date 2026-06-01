"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useSignalsFeed } from "@/hooks/useSignalsFeed";
import type { SignalDirectionFilter, SignalItem } from "@/lib/moneySignalApi";

function eventBadgeStyle(direction: SignalItem["direction"]) {
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

function rowBorderStyle(direction: SignalItem["direction"]) {
  if (direction === "bullish") return "border-l-[#4edea3]";
  if (direction === "bearish") return "border-l-[#ffb4ab]";
  if (direction === "mixed") return "border-l-[#ddb7ff]";
  return "border-l-[#5c6270]";
}

function scoreColor(direction: SignalItem["direction"]) {
  if (direction === "bullish") return "text-[#4edea3]";
  if (direction === "bearish") return "text-[#ffb4ab]";
  if (direction === "mixed") return "text-[#ddb7ff]";
  return "text-[#e0e2ed]";
}

function EmptyState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center border-t border-[#424754]/30 px-6 py-10 text-center">
      <MaterialIcon
        name="query_stats"
        className="mb-3 text-[36px] text-[#8c909f]"
      />

      <p className="text-[16px] font-semibold text-[#e0e2ed]">
        No signals found
      </p>

      <p className="mt-1 max-w-md text-[13px] text-[#8c909f]">
        Try refreshing or changing the selected filter.
      </p>
    </div>
  );
}

export function SignalsFeedList({
  direction,
}: {
  direction: SignalDirectionFilter;
}) {
  const { data, isLoading, isUsingFallback } = useSignalsFeed(direction);

  const visibleSignals = data.slice(0, 5);

  return (
    <div className="overflow-hidden rounded border border-[#424754]/40 bg-[#0a0e16]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#424754]/40 bg-[#111620]">
              <th className="w-[90px] px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                Ticker
              </th>

              <th className="w-[210px] px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                Signal Event
              </th>

              <th className="w-[90px] px-4 py-4 text-right font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                Score
              </th>

              <th className="w-[90px] px-4 py-4 text-right font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                Conf.
              </th>

              <th className="w-[150px] px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                Source
              </th>

              <th className="px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                AI Context
              </th>

              <th className="w-[100px] px-4 py-4 text-right font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2c6d6]">
                Time
              </th>
            </tr>
          </thead>

          {visibleSignals.length > 0 ? (
            <tbody className="divide-y divide-[#424754]/25">
              {visibleSignals.map((signal) => (
                <tr
                  key={signal.id}
                  className={`group border-l-2 bg-[#0a0e16] transition-colors hover:bg-[#121722] ${rowBorderStyle(
                    signal.direction
                  )}`}
                >
                  <td className="px-4 py-5 align-top">
                    <Link
                      href={`/stocks/${signal.ticker}`}
                      className="inline-flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#e0e2ed]"
                    >
                      {signal.ticker}

                      <MaterialIcon
                        name="open_in_new"
                        className="text-[15px] text-[#4edea3] opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </Link>
                  </td>

                  <td className="px-4 py-5 align-top">
                    <span
                      className={`inline-flex max-w-[190px] items-center rounded border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] ${eventBadgeStyle(
                        signal.direction
                      )}`}
                    >
                      {signal.signalEvent}
                    </span>
                  </td>

                  <td
                    className={`px-4 py-5 text-right align-top font-mono text-[16px] font-bold ${scoreColor(
                      signal.direction
                    )}`}
                  >
                    {signal.score}
                  </td>

                  <td className="px-4 py-5 text-right align-top font-mono text-[13px] text-[#d7d9e3]">
                    {signal.confidence}%
                  </td>

                  <td className="px-4 py-5 align-top font-mono text-[13px] leading-5 text-[#c2c6d6]">
                    {signal.source}
                  </td>

                  <td className="px-4 py-5 align-top text-[14px] leading-6 text-[#c2c6d6] group-hover:text-[#e0e2ed]">
                    {signal.aiContext}
                  </td>

                  <td className="px-4 py-5 text-right align-top font-mono text-[12px] text-[#8c909f]">
                    {signal.time}
                  </td>
                </tr>
              ))}
            </tbody>
          ) : null}
        </table>
      </div>

      {visibleSignals.length === 0 ? <EmptyState /> : null}

      <div className="flex items-center justify-between border-t border-[#424754]/40 bg-[#0d121b] px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#c2c6d6]">
            Showing 1-{visibleSignals.length} of 1,204 signals
          </span>

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

        <div className="flex gap-2">
          <button
            disabled
            className="rounded border border-[#424754]/50 bg-[#181c23] px-3 py-1.5 text-[13px] text-[#8c909f] opacity-50"
          >
            Prev
          </button>

          <button className="rounded border border-[#424754]/50 bg-[#181c23] px-3 py-1.5 text-[13px] text-[#c2c6d6] transition-colors hover:border-[#8c909f] hover:text-[#e0e2ed]">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}