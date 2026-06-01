"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useStockDetail } from "@/hooks/useStockDetail";
import { addWatchlistStock, type StockTone } from "@/lib/moneySignalApi";

function toneText(tone: StockTone) {
  if (tone === "positive") return "text-[#4edea3]";
  if (tone === "negative") return "text-[#ffb4ab]";
  if (tone === "secondary") return "text-[#ddb7ff]";
  if (tone === "primary") return "text-[#adc6ff]";
  return "text-[#c2c6d6]";
}

function toneBg(tone: StockTone) {
  if (tone === "positive") {
    return "border-[#4edea3]/20 bg-[#4edea3]/10 text-[#4edea3]";
  }

  if (tone === "negative") {
    return "border-[#ffb4ab]/20 bg-[#ffb4ab]/10 text-[#ffb4ab]";
  }

  if (tone === "secondary") {
    return "border-[#ddb7ff]/30 bg-[#6f00be]/20 text-[#ddb7ff]";
  }

  if (tone === "primary") {
    return "border-[#adc6ff]/30 bg-[#adc6ff]/10 text-[#adc6ff]";
  }

  return "border-[#424754] bg-[#31353d] text-[#e0e2ed]";
}

function toneBar(tone: StockTone) {
  if (tone === "positive") return "bg-[#4edea3]";
  if (tone === "negative") return "bg-[#ffb4ab]";
  if (tone === "primary") return "bg-[#adc6ff]";
  if (tone === "secondary") return "bg-[#ddb7ff]";
  return "bg-[#8c909f]";
}

export default function StockDetailPage() {
  const params = useParams();
  const ticker = String(params.ticker || "NVDA").toUpperCase();
  const { data, isLoading, isUsingFallback } = useStockDetail(ticker);

  const [watchlistState, setWatchlistState] = useState<
    "idle" | "saving" | "added" | "error"
  >("idle");

  const [watchlistMessage, setWatchlistMessage] = useState<string | null>(null);

  async function handleAddToWatchlist() {
    try {
      setWatchlistState("saving");
      setWatchlistMessage(null);

      await addWatchlistStock(data.ticker);

      setWatchlistState("added");
      setWatchlistMessage(`${data.ticker} added to watchlist.`);
    } catch (error) {
      setWatchlistState("error");
      setWatchlistMessage(
        error instanceof Error
          ? error.message
          : "Unable to add this stock right now."
      );
    }
  }

  return (
    <AppShell activePage="Stocks">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="rounded border border-[#4d8eff]/30 bg-[#4d8eff]/20 px-3 py-1 font-mono text-[18px] text-[#adc6ff]">
              {data.ticker}
            </span>

            <h1 className="text-[24px] font-semibold text-[#e0e2ed]">
              {data.companyName}
            </h1>

            <span className="hidden rounded border border-[#424754] bg-[#262a32] px-2 py-0.5 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6] sm:inline-block">
              {data.category}
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

          <div className="flex items-baseline gap-3">
            <span className="text-[48px] font-bold leading-none tracking-[-0.02em] text-[#e0e2ed]">
              {data.price}
            </span>

            <span className="flex items-center font-mono text-[14px] text-[#4edea3]">
              <MaterialIcon name="arrow_upward" className="text-[16px]" />
              {data.changeAmount} ({data.changePercent})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleAddToWatchlist}
              disabled={watchlistState === "saving" || watchlistState === "added"}
              className="flex items-center justify-center gap-2 rounded border border-[#424754] bg-[#0D121F] px-4 py-2 text-[13px] text-[#e0e2ed] transition-colors hover:bg-[#262a32] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <MaterialIcon
                name={watchlistState === "added" ? "check_circle" : "bookmark_add"}
                className="text-[18px]"
              />
              {watchlistState === "saving"
                ? "Adding..."
                : watchlistState === "added"
                  ? "Added"
                  : "Add to Watchlist"}
            </button>

            {watchlistMessage ? (
              <p
                className={`max-w-[220px] text-[12px] leading-5 ${
                  watchlistState === "error" ? "text-[#ffb4ab]" : "text-[#4edea3]"
                }`}
              >
                {watchlistMessage}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-[#424754] bg-[#181c23] p-3">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#31353d"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#4edea3"
                  strokeDasharray={`${data.moneySignalScore}, 100`}
                  strokeWidth="3"
                />
              </svg>

              <span className="absolute font-mono text-[18px] text-[#e0e2ed]">
                {data.moneySignalScore}
              </span>
            </div>

            <div>
              <span className="block font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
                MoneySignal Score
              </span>
              <span className="text-[18px] font-semibold text-[#4edea3]">
                {data.scoreLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="relative overflow-hidden rounded-lg border border-[#6f00be]/50 bg-[#0D121F] p-4">
            <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-[#6f00be] to-transparent opacity-60" />

            <div className="mb-4 flex items-center justify-between border-b border-[#424754]/50 pb-3">
              <div className="flex items-center gap-2 text-[#ddb7ff]">
                <MaterialIcon name="auto_awesome" className="text-[22px]" />
                <h2 className="text-[18px] font-semibold">AI Synthesis</h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4edea3]" />
                <span className="font-mono text-[12px] uppercase tracking-wider text-[#4edea3]">
                  Live Model
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
                  Executive Summary
                </h3>
                <p className="text-[14px] leading-7 text-[#e0e2ed]">
                  {data.executiveSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
                    Why It Matters
                  </h3>
                  <p className="text-[14px] leading-7 text-[#e0e2ed]">
                    {data.whyItMatters}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
                      Watch Next
                    </h3>

                    <ul className="space-y-2">
                      {data.watchNext.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-[14px] text-[#e0e2ed]"
                        >
                          <MaterialIcon
                            name="event"
                            className="mt-0.5 text-[16px] text-[#adc6ff]"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded border border-[#ffb4ab]/20 bg-[#93000a]/10 p-3">
                    <h3 className="mb-1 flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-[#ffb4ab]">
                      <MaterialIcon name="warning" className="text-[14px]" />
                      Limitations / Risks
                    </h3>
                    <p className="text-[12px] leading-5 text-[#c2c6d6]">
                      {data.riskNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#424754] bg-[#0D121F] p-4">
            <div className="mb-6 flex items-center gap-2 border-b border-[#424754]/50 pb-3">
              <MaterialIcon name="assessment" className="text-[22px] text-[#adc6ff]" />
              <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
                Factor Breakdown
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              {data.factorBreakdown.map((factor) => (
                <div key={factor.label} className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
                      {factor.label}
                    </span>
                    <span className={`font-mono text-[14px] ${toneText(factor.tone)}`}>
                      {factor.value}/100
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-[#31353d]">
                    <div
                      className={`h-full rounded-full ${toneBar(factor.tone)}`}
                      style={{ width: `${factor.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-[#424754] bg-[#0D121F]">
              <div className="flex items-center justify-between border-b border-[#424754] bg-[#181c23] p-4">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="account_balance" className="text-[#adc6ff]" />
                  <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
                    Q4 Fund Movement (13F)
                  </h2>
                </div>

                <button className="flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6] hover:text-[#adc6ff]">
                  View All
                  <MaterialIcon name="arrow_forward" className="text-[14px]" />
                </button>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#424754] bg-[#31353d]/50">
                    <th className="p-3 font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6]">
                      Institution
                    </th>
                    <th className="p-3 font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6]">
                      Action
                    </th>
                    <th className="p-3 text-right font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6]">
                      Shares Change
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#424754]/30 text-[13px]">
                  {data.fundMovement.map((fund) => (
                    <tr
                      key={`${fund.institution}-${fund.sharesChange}`}
                      className="hover:bg-[#262a32]"
                    >
                      <td className="p-3 font-medium text-[#e0e2ed]">
                        {fund.institution}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${toneBg(
                            fund.tone
                          )}`}
                        >
                          {fund.action}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-mono ${toneText(fund.tone)}`}>
                        {fund.sharesChange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#424754] bg-[#0D121F]">
              <div className="flex items-center justify-between border-b border-[#424754] bg-[#181c23] p-4">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="person_search" className="text-[#ddb7ff]" />
                  <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
                    Insider Trades (Form 4)
                  </h2>
                </div>

                <button className="flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6] hover:text-[#ddb7ff]">
                  View All
                  <MaterialIcon name="arrow_forward" className="text-[14px]" />
                </button>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#424754] bg-[#31353d]/50">
                    <th className="p-3 font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6]">
                      Insider
                    </th>
                    <th className="p-3 font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6]">
                      Type
                    </th>
                    <th className="p-3 text-right font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6]">
                      Value
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#424754]/30 text-[13px]">
                  {data.insiderTrades.map((trade) => (
                    <tr
                      key={`${trade.insider}-${trade.value}`}
                      className="hover:bg-[#262a32]"
                    >
                      <td className="p-3 font-medium text-[#e0e2ed]">
                        {trade.insider}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${toneBg(
                            trade.tone
                          )}`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-mono ${toneText(trade.tone)}`}>
                        {trade.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-[#424754] bg-[#0D121F] p-4 lg:col-span-4">
          <div className="mb-4 flex items-center gap-2 border-b border-[#424754]/50 pb-3">
            <MaterialIcon name="timeline" className="text-[#c2c6d6]" />
            <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
              Signal Timeline
            </h2>
          </div>

          <div className="relative">
            <div className="absolute bottom-2 left-[7px] top-2 z-0 w-px bg-[#424754]/50" />

            <div className="relative z-10 flex flex-col gap-6">
              {data.timeline.map((event) => (
                <div key={`${event.label}-${event.time}`} className="flex gap-4">
                  <div
                    className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 bg-[#10131b] ${
                      event.tone === "positive"
                        ? "border-[#4edea3]"
                        : event.tone === "negative"
                          ? "border-[#ffb4ab]"
                          : event.tone === "secondary"
                            ? "border-[#6f00be]"
                            : event.tone === "primary"
                              ? "border-[#adc6ff]"
                              : "border-[#8c909f]"
                    }`}
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${toneBg(
                          event.tone
                        )}`}
                      >
                        {event.label}
                      </span>
                      <span className="font-mono text-[10px] text-[#c2c6d6]">
                        {event.time}
                      </span>
                    </div>

                    <p className="text-[13px] leading-6 text-[#e0e2ed]">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <p className="pt-4 text-center font-mono text-[12px] text-[#c2c6d6]">
        Research intelligence only. Not financial advice. Verify all signals
        against primary public filings.
      </p>
    </AppShell>
  );
}