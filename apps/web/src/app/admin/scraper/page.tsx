"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getSchedulerStatus,
  getScrapeHistory,
  ingestRecent13F,
  ingestRecentForm4,
  runSchedulerScrape,
  type SchedulerStatusResponse,
  type ScrapeHistoryItem,
} from "@/lib/moneySignalApi";

function statusClass(status?: string) {
  if (!status) return "bg-slate-100 text-slate-600";
  if (status.includes("processed")) return "bg-emerald-50 text-emerald-700";
  if (status === "skipped") return "bg-amber-50 text-amber-700";
  if (status === "failed" || status === "error") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

export default function ScraperAdminPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [form4Limit, setForm4Limit] = useState(10);

  const [fundCik, setFundCik] = useState("1067983");
  const [thirteenFLimit, setThirteenFLimit] = useState(3);

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<ScrapeHistoryItem[]>([]);
  const [schedulerStatus, setSchedulerStatus] =
    useState<SchedulerStatusResponse | null>(null);

  async function refreshAdminData() {
    try {
      const [statusResponse, historyResponse] = await Promise.all([
        getSchedulerStatus(),
        getScrapeHistory(25),
      ]);

      setSchedulerStatus(statusResponse);
      setHistory(historyResponse);
    } catch (loadError) {
      console.error("Failed to refresh scraper admin data:", loadError);
    }
  }

  useEffect(() => {
    refreshAdminData();
  }, []);

  async function runAction(action: () => Promise<unknown>) {
    try {
      setIsRunning(true);
      setError(null);
      setResult(null);

      const response = await action();

      setResult(response);
      await refreshAdminData();
    } catch (actionError) {
      console.error(actionError);
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Failed to run scraper action"
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600">MoneySignal AI</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              Scraper Admin
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Trigger SEC Form 4 and 13F ingestion without using Swagger.
            </p>
          </div>

          <Link
            href="/market"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
          >
            Back to Market
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Scheduler</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {schedulerStatus?.running ? "Running" : "Stopped"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Every {schedulerStatus?.scheduleHours ?? "--"} hours
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Max Filings</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {schedulerStatus?.maxFilings ?? "--"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Default scheduler batch size
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Cooldown</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {schedulerStatus?.cooldownHours ?? "--"}h
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Prevents repeated scraping
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              SEC Form 4 Ingestion
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pull recent insider trading filings for a tracked ticker.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Ticker
                </span>
                <input
                  value={ticker}
                  onChange={(event) => setTicker(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="AAPL"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Limit
                </span>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={form4Limit}
                  onChange={(event) => setForm4Limit(Number(event.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                disabled={isRunning}
                onClick={() =>
                  runAction(() => ingestRecentForm4(ticker, form4Limit))
                }
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Run Form 4 Ingestion
              </button>

              <button
                disabled={isRunning}
                onClick={() =>
                  runAction(() => runSchedulerScrape(ticker, form4Limit))
                }
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Run Scheduler Scrape
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              SEC 13F Ingestion
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pull institutional holdings from a fund or institution CIK.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Fund CIK
                </span>
                <input
                  value={fundCik}
                  onChange={(event) => setFundCik(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="1067983"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Limit
                </span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={thirteenFLimit}
                  onChange={(event) =>
                    setThirteenFLimit(Number(event.target.value))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <div className="mt-5">
              <button
                disabled={isRunning}
                onClick={() =>
                  runAction(() => ingestRecent13F(fundCik, thirteenFLimit))
                }
                className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Run 13F Ingestion
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
              Common CIKs: Berkshire Hathaway{" "}
              <span className="font-mono">1067983</span>, Renaissance{" "}
              <span className="font-mono">1037389</span>, Bridgewater{" "}
              <span className="font-mono">1350694</span>
            </div>
          </div>
        </section>

        {error && (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </section>
        )}

        {result !== null && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Latest Run Result
            </h2>
            <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">
              Scrape History
            </h2>
            <button
              onClick={refreshAdminData}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Ticker</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Found</th>
                  <th className="px-6 py-3">Processed</th>
                  <th className="px-6 py-3">Skipped</th>
                  <th className="px-6 py-3">Failed</th>
                  <th className="px-6 py-3">Records</th>
                  <th className="px-6 py-3">Started</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      {row.ticker}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.sourceType}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.filingsFound}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.filingsProcessed}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.filingsSkipped}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.filingsFailed}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.recordsCreated}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {row.startedAt
                        ? new Date(row.startedAt).toLocaleString()
                        : "--"}
                    </td>
                  </tr>
                ))}

                {history.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No scrape history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}