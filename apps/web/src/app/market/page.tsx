"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getMarketOverview,
  type MarketOverviewItem,
} from "@/lib/moneySignalApi";

function toneClass(tone?: string | null) {
  if (tone === "positive") return "text-emerald-600";
  if (tone === "negative") return "text-red-500";
  return "text-slate-500";
}

function scoreTone(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 60) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export default function MarketOverviewPage() {
  const [items, setItems] = useState<MarketOverviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      try {
        setIsLoading(true);
        const response = await getMarketOverview(50);

        if (isMounted) {
          setItems(response.data);
        }
      } catch (error) {
        console.error("Failed to load market overview:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalSignals = useMemo(
    () => items.reduce((sum, item) => sum + item.smartMoneyActivityCount, 0),
    [items]
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-slate-500">Loading market overview...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-blue-600">MoneySignal AI</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            <Link
                href="/admin/scraper"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
                >
                Scraper Admin
            </Link>
            Market Overview
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Live prices, MoneySignal scores, insider activity, and institutional
            13F movement across all tracked companies.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Tracked Companies</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {items.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Smart-Money Events</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {totalSignals}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Data Sources</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                Form 4 + 13F
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">
              Smart-Money Watchlist
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <Link
                key={item.ticker}
                href={`/stocks/${item.ticker}`}
                className="grid gap-4 px-6 py-5 transition hover:bg-slate-50 lg:grid-cols-[1.2fr_0.8fr_1fr_1fr]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold text-slate-950">
                      {item.ticker}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreTone(
                        item.moneySignalScore
                      )}`}
                    >
                      {item.moneySignalScore.toFixed(0)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.companyName}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.category}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Live Price</p>
                  <p className="mt-1 text-base font-semibold text-slate-950">
                    {item.price ?? "$--"}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      item.changePercent?.startsWith("-")
                        ? "text-red-500"
                        : "text-emerald-600"
                    }`}
                  >
                    {item.changeAmount ?? "--"} ({item.changePercent ?? "--"})
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Latest Fund Activity</p>
                  {item.latestFundActivity ? (
                    <>
                      <p
                        className={`mt-1 text-sm font-semibold ${toneClass(
                          item.latestFundActivity.tone
                        )}`}
                      >
                        {item.latestFundActivity.action}{" "}
                        {item.latestFundActivity.sharesChange}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.latestFundActivity.institution}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">
                      No 13F activity yet
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-500">Latest Signal</p>
                  {item.latestSignal ? (
                    <>
                      <p
                        className={`mt-1 text-sm font-semibold ${toneClass(
                          item.latestSignal.tone
                        )}`}
                      >
                        {item.latestSignal.label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {item.latestSignal.description}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">
                      No signal yet
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}