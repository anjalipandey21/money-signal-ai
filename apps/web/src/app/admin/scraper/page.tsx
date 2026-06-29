"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  getSchedulerStatus,
  getScrapeHistory,
  getCompanyUniverseStats,
  importSecCompanyUniverse,
  ingestRecent13F,
  ingestRecentForm4,
  runFullIngestionPipeline,
  runSchedulerScrape,
  type FullIngestionPipelineResponse,
  type CompanyUniverseStats,
  type IngestionRunStartResponse,
  type IngestionPipelineIssue,
  type IngestionStageResult,
  type SchedulerStatusResponse,
  type ScrapeHistoryItem,
  type SecCompanyUniverseImportResponse,
} from "@/lib/moneySignalApi";

type ActionResult = {
  title: string;
  payload: unknown;
};

const POLL_INTERVAL_MS = 3_000;
const MAX_PIPELINE_POLLS = 600;

function statusClass(status?: string) {
  if (!status) return "border-slate-700 bg-slate-800 text-slate-300";
  if (status === "partial" || status.includes("warning")) {
    return "border-amber-300/30 bg-amber-300/10 text-amber-200";
  }
  if (status.includes("processed") || status === "success") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }
  if (status === "skipped" || status === "timed_out") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-200";
  }
  if (status === "failed" || status === "error") {
    return "border-red-300/30 bg-red-300/10 text-red-200";
  }
  return "border-slate-700 bg-slate-800 text-slate-300";
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded border border-[#424754]/60 bg-[#181c23] p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-[#8c909f]">
        {label}
      </p>
      <p className="mt-3 text-[28px] font-semibold text-[#e0e2ed]">{value}</p>
      <p className="mt-1 text-[12px] text-[#c2c6d6]">{detail}</p>
    </div>
  );
}

function formatCount(value?: number | null) {
  return value ?? "--";
}

function formatDuration(value?: number | null) {
  return value == null ? "--" : `${value}s`;
}

function stageName(stage: IngestionStageResult) {
  return stage.name ?? stage.stage;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function IssueList({
  title,
  issues,
  tone,
}: {
  title: string;
  issues?: IngestionPipelineIssue[];
  tone: "warning" | "error";
}) {
  if (!issues?.length) return null;

  const classes =
    tone === "warning"
      ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
      : "border-red-300/30 bg-red-300/10 text-red-100";

  return (
    <div className={`mt-4 rounded border p-3 ${classes}`}>
      <p className="font-mono text-[11px] uppercase tracking-wider">{title}</p>
      <ul className="mt-2 space-y-1 text-[12px] leading-5">
        {issues.slice(0, 5).map((issue, index) => (
          <li key={`${issue.stage ?? title}-${issue.ticker ?? issue.cik ?? index}`}>
            <span className="font-semibold">
              {issue.ticker ?? issue.fund ?? issue.cik ?? issue.stage ?? "Pipeline"}
            </span>
            {": "}
            {issue.message}
            {issue.error ? ` (${issue.error})` : ""}
          </li>
        ))}
      </ul>
      {issues.length > 5 ? (
        <p className="mt-2 text-[12px] opacity-80">
          Showing 5 of {issues.length}. See raw response for the full sample.
        </p>
      ) : null}
    </div>
  );
}

function PipelineResultDetails({
  result,
}: {
  result: FullIngestionPipelineResponse;
}) {
  const totals = result.totals;

  return (
    <div className="mt-5 space-y-4">
      {totals ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Processed"
            value={formatCount(totals.processed)}
            detail="Items completed"
          />
          <StatCard
            label="Records"
            value={formatCount(totals.recordsCreated)}
            detail={`${formatCount(totals.skipped)} skipped · ${formatCount(
              totals.failed
            )} failed`}
          />
        </div>
      ) : null}

      {result.stages?.length ? (
        <div className="overflow-hidden rounded border border-[#424754]/50">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead className="bg-[#181c23] font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
              <tr>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Done</th>
                <th className="px-3 py-2 text-right">Created</th>
                <th className="px-3 py-2 text-right">Skipped</th>
                <th className="px-3 py-2 text-right">Failed</th>
                <th className="px-3 py-2 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#424754]/40">
              {result.stages.map((stage, index) => (
                <tr key={`${stageName(stage)}-${index}`} className="bg-[#0d121f]">
                  <td className="px-3 py-3 font-semibold text-[#e0e2ed]">
                    <p>{stageName(stage)}</p>
                    {stage.message ? (
                      <p className="mt-1 text-[11px] font-normal leading-4 text-[#8c909f]">
                        {stage.message}
                      </p>
                    ) : null}
                    {stage.skippedTickers?.length ? (
                      <p className="mt-1 text-[11px] font-normal leading-4 text-amber-200/80">
                        Skipped: {stage.skippedTickers.slice(0, 6).join(", ")}
                        {stage.skippedTickers.length > 6 ? "..." : ""}
                      </p>
                    ) : null}
                    {stage.failedTickers?.length ? (
                      <p className="mt-1 text-[11px] font-normal leading-4 text-red-200/80">
                        Failed: {stage.failedTickers.slice(0, 6).join(", ")}
                        {stage.failedTickers.length > 6 ? "..." : ""}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${statusClass(
                        stage.status
                      )}`}
                    >
                      {stage.status ?? "success"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatCount(stage.processed)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatCount(stage.created ?? stage.recordsCreated)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatCount(stage.skipped)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatCount(stage.failed)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatDuration(stage.durationSeconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <IssueList title="Warnings" issues={result.warnings} tone="warning" />
      <IssueList title="Errors" issues={result.errors} tone="error" />
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const classes =
    variant === "primary"
      ? "bg-[#adc6ff] text-[#002e6a] hover:bg-[#d8e2ff]"
      : "border border-[#424754] bg-[#181c23] text-[#e0e2ed] hover:border-[#adc6ff]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-4 py-2.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      {children}
    </button>
  );
}

export default function ScraperAdminPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [form4Limit, setForm4Limit] = useState(10);
  const [fundCik, setFundCik] = useState("1067983");
  const [thirteenFLimit, setThirteenFLimit] = useState(3);
  const [marketLimit, setMarketLimit] = useState(25);
  const [universeLimit, setUniverseLimit] = useState(100);
  const [enrichProfile, setEnrichProfile] = useState(false);
  const [refreshMarket, setRefreshMarket] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [activeActionTitle, setActiveActionTitle] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScrapeHistoryItem[]>([]);
  const [universeStats, setUniverseStats] = useState<CompanyUniverseStats | null>(
    null
  );
  const [schedulerStatus, setSchedulerStatus] =
    useState<SchedulerStatusResponse | null>(null);

  async function refreshAdminData() {
    const [statusResponse, historyResponse, universeStatsResponse] =
      await Promise.all([
        getSchedulerStatus(),
        getScrapeHistory(50),
        getCompanyUniverseStats(),
      ]);

    setSchedulerStatus(statusResponse);
    setHistory(historyResponse);
    setUniverseStats(universeStatsResponse);
  }

  async function pollPipelineResult(runId: string) {
    for (let attempt = 0; attempt < MAX_PIPELINE_POLLS; attempt += 1) {
      await sleep(POLL_INTERVAL_MS);

      const [statusResponse, historyResponse] = await Promise.all([
        getSchedulerStatus(),
        getScrapeHistory(50),
      ]);

      setSchedulerStatus(statusResponse);
      setHistory(historyResponse);

      if (statusResponse.latestRunId !== runId) {
        continue;
      }

      if (statusResponse.latestResult) {
        setResult({
          title: "Full ingestion pipeline",
          payload: statusResponse.latestResult,
        });
      }

      if (!statusResponse.running) {
        return (
          statusResponse.latestResult ?? {
            success: statusResponse.latestStatus !== "failed",
            status: statusResponse.latestStatus ?? "complete",
            runId,
            message: "Pipeline finished. Check Scrape History for details.",
            startedAt: statusResponse.startedAt,
            completedAt: statusResponse.completedAt,
            durationSeconds: statusResponse.durationSeconds,
          }
        );
      }
    }

    return {
      success: false,
      status: "timed_out",
      runId,
      message:
        "Pipeline is still running. Keep this page open or check Scrape History for the latest result.",
      startedAt: schedulerStatus?.startedAt ?? null,
      completedAt: null,
      durationSeconds: null,
    };
  }

  async function runFullPipelineAction() {
    const title = "Full ingestion pipeline";

    try {
      setIsRunning(true);
      setActiveActionTitle(title);
      setError(null);
      setResult({
        title,
        payload: {
          success: true,
          status: "starting",
          message: "Starting pipeline in the background...",
          startedAt: new Date().toISOString(),
          completedAt: null,
          durationSeconds: null,
        },
      });

      const startPayload = await runFullIngestionPipeline({
        form4Limit,
        thirteenFLimit,
        refreshMarket,
        marketLimit,
      });

      setResult({ title, payload: startPayload });

      if (!startPayload.runId) {
        throw new Error("Pipeline did not return a run id.");
      }

      const finalPayload = await pollPipelineResult(startPayload.runId);

      setResult({ title, payload: finalPayload });
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : "Failed to start ingestion pipeline";

      setResult({
        title,
        payload: {
          success: false,
          status: "error",
          message,
        },
      });
      setError(message);
    } finally {
      try {
        await refreshAdminData();
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Failed to refresh scrape history"
        );
      } finally {
        setIsRunning(false);
        setActiveActionTitle(null);
      }
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      try {
        const [statusResponse, historyResponse, universeStatsResponse] =
          await Promise.all([
            getSchedulerStatus(),
            getScrapeHistory(50),
            getCompanyUniverseStats(),
          ]);

        if (!isMounted) return;

        setSchedulerStatus(statusResponse);
        setHistory(historyResponse);
        setUniverseStats(universeStatsResponse);
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load ingestion status"
        );
      }
    }

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function runAction(title: string, action: () => Promise<unknown>) {
    try {
      setIsRunning(true);
      setActiveActionTitle(title);
      setError(null);
      setResult({
        title,
        payload: {
          success: null,
          status: "running",
          message: "Pipeline request is running. Latest scrape history will refresh when it finishes or times out.",
        },
      });

      const payload = await action();

      setResult({ title, payload });
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : "Failed to run ingestion action";
      const isTimeout =
        actionError instanceof Error && actionError.name === "TimeoutError";

      const payload = isTimeout
        ? {
            success: false,
            status: "timed_out",
            message:
              "Pipeline started or completed, but the request timed out. Check Scrape History for latest result.",
          }
        : {
            success: false,
            status: "error",
            message,
          };

      setResult({ title, payload });
      setError(isTimeout ? null : message);
    } finally {
      try {
        await refreshAdminData();
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Failed to refresh scrape history"
        );
      } finally {
        setIsRunning(false);
        setActiveActionTitle(null);
      }
    }
  }

  const latestRun = history[0];
  const pipelineResult = result?.payload as
    | FullIngestionPipelineResponse
    | IngestionRunStartResponse
    | SecCompanyUniverseImportResponse
    | undefined;
  const fullPipelineResult =
    pipelineResult && "stages" in pipelineResult
      ? (pipelineResult as FullIngestionPipelineResponse)
      : null;
  const resultMessage =
    result &&
    typeof (result.payload as { message?: unknown }).message === "string"
      ? ((result.payload as { message: string }).message)
      : null;

  const totalRecords = useMemo(
    () => history.reduce((sum, row) => sum + row.recordsCreated, 0),
    [history]
  );

  return (
    <main className="min-h-screen bg-[#10131b] px-6 py-8 text-[#e0e2ed]">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-[#424754]/50 pb-6 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#adc6ff]">
              MoneySignal AI
            </p>
            <h1 className="mt-2 text-[40px] font-semibold leading-tight">
              Ingestion Control Center
            </h1>
            <p className="mt-2 max-w-3xl text-[14px] text-[#c2c6d6]">
              Run SEC universe import, market refreshes, Form 4 ingestion, 13F
              ingestion, and MoneySignal score recalculation from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/market"
              className="rounded border border-[#424754] bg-[#181c23] px-4 py-2.5 text-[13px] font-semibold text-[#e0e2ed] transition hover:border-[#adc6ff]"
            >
              Market Overview
            </Link>
            <Link
              href="/dashboard"
              className="rounded bg-[#adc6ff] px-4 py-2.5 text-[13px] font-semibold text-[#002e6a] transition hover:bg-[#d8e2ff]"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Pipeline"
            value={
              schedulerStatus?.running
                ? "Running"
                : schedulerStatus?.latestStatus ?? "Idle"
            }
            detail={
              schedulerStatus?.latestRunId
                ? `Run ${schedulerStatus.latestRunId.slice(0, 8)}`
                : `Scheduled every ${schedulerStatus?.scheduleHours ?? "--"}h`
            }
          />
          <StatCard
            label="Form 4 Limit"
            value={schedulerStatus?.maxFilings ?? "--"}
            detail="Scheduled filing batch size"
          />
          <StatCard
            label="13F Limit"
            value={schedulerStatus?.thirteenFMaxFilings ?? "--"}
            detail="Institutional filing batch size"
          />
          <StatCard
            label="Records Logged"
            value={totalRecords}
            detail={`${history.length} scrape history rows`}
          />
        </section>

        <section className="rounded border border-[#424754]/60 bg-[#0d121f] p-5">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#8c909f]">
                Company Universe
              </p>
              <h2 className="mt-1 text-[20px] font-semibold">
                Dynamic database universe
              </h2>
            </div>
            <p className="text-[12px] text-[#8c909f]">
              Full pipeline reads the current companies table.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total"
              value={formatCount(universeStats?.totalCompanies)}
              detail="Companies in database"
            />
            <StatCard
              label="With CIK"
              value={formatCount(universeStats?.companiesWithCik)}
              detail={`${formatCount(
                universeStats?.companiesWithoutCik
              )} without CIK`}
            />
            <StatCard
              label="Form 4 Eligible"
              value={formatCount(universeStats?.eligibleForForm4)}
              detail="Has CIK and common-stock profile"
            />
            <StatCard
              label="Market Eligible"
              value={formatCount(universeStats?.eligibleForMarketRefresh)}
              detail={
                universeStats?.byExchange?.length
                  ? `Top exchange: ${universeStats.byExchange[0].exchange}`
                  : "Awaiting universe stats"
              }
            />
          </div>
        </section>

        {error ? (
          <section className="rounded border border-red-300/30 bg-red-300/10 p-4 text-[13px] text-red-100">
            <p className="font-semibold">Backend error</p>
            <p className="mt-1 break-words">{error}</p>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded border border-[#424754]/60 bg-[#0d121f] p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#8c909f]">
                  Full Pipeline
                </p>
                <h2 className="mt-2 text-[24px] font-semibold">
                  Run TradeSignal-style ingestion
                </h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#c2c6d6]">
                  Refresh market snapshots, ingest SEC Form 4 and 13F filings,
                  generate signals, recalculate MoneySignal scores, and write a
                  scrape history entry.
                </p>
              </div>

              <span
                className={`w-fit rounded-full border px-3 py-1 font-mono text-[11px] uppercase ${statusClass(
                  latestRun?.status
                )}`}
              >
                {latestRun?.status ?? "No runs yet"}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <label className="space-y-2">
                <span className="font-mono text-[11px] uppercase text-[#8c909f]">
                  Form 4 Limit
                </span>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={form4Limit}
                  onChange={(event) => setForm4Limit(Number(event.target.value))}
                  className="w-full rounded border border-[#424754] bg-[#181c23] px-3 py-2 text-[14px] outline-none focus:border-[#adc6ff]"
                />
              </label>

              <label className="space-y-2">
                <span className="font-mono text-[11px] uppercase text-[#8c909f]">
                  13F Limit
                </span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={thirteenFLimit}
                  onChange={(event) =>
                    setThirteenFLimit(Number(event.target.value))
                  }
                  className="w-full rounded border border-[#424754] bg-[#181c23] px-3 py-2 text-[14px] outline-none focus:border-[#adc6ff]"
                />
              </label>

              <label className="space-y-2">
                <span className="font-mono text-[11px] uppercase text-[#8c909f]">
                  Market Limit
                </span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={marketLimit}
                  onChange={(event) => setMarketLimit(Number(event.target.value))}
                  className="w-full rounded border border-[#424754] bg-[#181c23] px-3 py-2 text-[14px] outline-none focus:border-[#adc6ff]"
                />
              </label>

              <label className="flex items-end gap-3 rounded border border-[#424754]/50 bg-[#181c23] px-3 py-2">
                <input
                  type="checkbox"
                  checked={refreshMarket}
                  onChange={(event) => setRefreshMarket(event.target.checked)}
                  className="h-4 w-4 accent-[#adc6ff]"
                />
                <span className="text-[13px] text-[#c2c6d6]">
                  Refresh market data
                </span>
              </label>
            </div>

            <div className="mt-5">
              <ActionButton
                disabled={isRunning}
                onClick={runFullPipelineAction}
              >
                {activeActionTitle === "Full ingestion pipeline"
                  ? "Running Pipeline..."
                  : "Run Full Pipeline"}
              </ActionButton>
            </div>
          </div>

          <div className="rounded border border-[#424754]/60 bg-[#0d121f] p-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#8c909f]">
              Latest Result
            </p>
            <h2 className="mt-2 text-[24px] font-semibold">
              {result?.title ?? "Waiting for action"}
            </h2>

            {pipelineResult ? (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <StatCard
                    label="Status"
                    value={pipelineResult.status ?? "Complete"}
                    detail="Last action response"
                  />
                  <StatCard
                    label="Duration"
                    value={`${pipelineResult.durationSeconds ?? 0}s`}
                    detail="Wall-clock runtime"
                  />
                </div>
                {resultMessage ? (
                  <p className="mt-4 rounded border border-[#424754]/50 bg-[#181c23] p-3 text-[13px] leading-6 text-[#c2c6d6]">
                    {resultMessage}
                  </p>
                ) : null}
                {fullPipelineResult ? (
                  <PipelineResultDetails result={fullPipelineResult} />
                ) : null}
              </>
            ) : (
              <p className="mt-4 text-[13px] leading-6 text-[#c2c6d6]">
                Run an ingestion action to inspect its JSON response here.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded border border-[#424754]/60 bg-[#181c23] p-5">
            <h2 className="text-[18px] font-semibold">SEC Company Universe</h2>
            <p className="mt-2 text-[13px] text-[#c2c6d6]">
              Import tickers, company names, exchanges, and CIKs from the SEC.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block space-y-2">
                <span className="font-mono text-[11px] uppercase text-[#8c909f]">
                  Limit
                </span>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={universeLimit}
                  onChange={(event) => setUniverseLimit(Number(event.target.value))}
                  className="w-full rounded border border-[#424754] bg-[#0d121f] px-3 py-2 text-[14px] outline-none focus:border-[#adc6ff]"
                />
              </label>

              <label className="flex items-center gap-2 text-[13px] text-[#c2c6d6]">
                <input
                  type="checkbox"
                  checked={enrichProfile}
                  onChange={(event) => setEnrichProfile(event.target.checked)}
                  className="h-4 w-4 accent-[#adc6ff]"
                />
                Enrich profile with provider metadata
              </label>
            </div>

            <div className="mt-5">
              <ActionButton
                disabled={isRunning}
                onClick={() =>
                  runAction("SEC company universe import", () =>
                    importSecCompanyUniverse({
                      limit: universeLimit,
                      enrichProfile,
                    })
                  )
                }
                variant="secondary"
              >
                Import SEC Universe
              </ActionButton>
            </div>
          </div>

          <div className="rounded border border-[#424754]/60 bg-[#181c23] p-5">
            <h2 className="text-[18px] font-semibold">Form 4 Ingestion</h2>
            <p className="mt-2 text-[13px] text-[#c2c6d6]">
              Pull recent insider trade filings for a tracked ticker.
            </p>

            <label className="mt-4 block space-y-2">
              <span className="font-mono text-[11px] uppercase text-[#8c909f]">
                Ticker
              </span>
              <input
                value={ticker}
                onChange={(event) => setTicker(event.target.value)}
                className="w-full rounded border border-[#424754] bg-[#0d121f] px-3 py-2 text-[14px] outline-none focus:border-[#adc6ff]"
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButton
                disabled={isRunning}
                onClick={() =>
                  runAction("Form 4 ingestion", () =>
                    ingestRecentForm4(ticker, form4Limit)
                  )
                }
                variant="secondary"
              >
                Run Form 4
              </ActionButton>
              <ActionButton
                disabled={isRunning}
                onClick={() =>
                  runAction("Scheduler Form 4 scrape", () =>
                    runSchedulerScrape(ticker, form4Limit)
                  )
                }
                variant="secondary"
              >
                Scheduler Scrape
              </ActionButton>
            </div>
          </div>

          <div className="rounded border border-[#424754]/60 bg-[#181c23] p-5">
            <h2 className="text-[18px] font-semibold">13F Ingestion</h2>
            <p className="mt-2 text-[13px] text-[#c2c6d6]">
              Pull institutional holdings from a fund CIK.
            </p>

            <label className="mt-4 block space-y-2">
              <span className="font-mono text-[11px] uppercase text-[#8c909f]">
                Fund CIK
              </span>
              <input
                value={fundCik}
                onChange={(event) => setFundCik(event.target.value)}
                className="w-full rounded border border-[#424754] bg-[#0d121f] px-3 py-2 text-[14px] outline-none focus:border-[#adc6ff]"
              />
            </label>

            <div className="mt-5">
              <ActionButton
                disabled={isRunning}
                onClick={() =>
                  runAction("13F ingestion", () =>
                    ingestRecent13F(fundCik, thirteenFLimit)
                  )
                }
                variant="secondary"
              >
                Run 13F
              </ActionButton>
            </div>
          </div>
        </section>

        {result ? (
          <section className="rounded border border-[#424754]/60 bg-[#0d121f] p-6">
            <h2 className="text-[20px] font-semibold">Raw Action Response</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto rounded border border-[#424754]/50 bg-[#090d15] p-4 text-[12px] text-[#c2c6d6]">
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          </section>
        ) : null}

        <section className="overflow-hidden rounded border border-[#424754]/60 bg-[#0d121f]">
          <div className="flex items-center justify-between border-b border-[#424754]/50 px-6 py-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#8c909f]">
                Scrape History
              </p>
              <h2 className="mt-1 text-[20px] font-semibold">
                Pipeline and filing runs
              </h2>
            </div>

            <ActionButton
              disabled={isRunning}
              onClick={() =>
                runAction("Refresh admin data", async () => {
                  await refreshAdminData();
                  return { success: true, message: "Admin data refreshed" };
                })
              }
              variant="secondary"
            >
              Refresh
            </ActionButton>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-[13px]">
              <thead className="bg-[#181c23] font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
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
                  <th className="px-6 py-3">Error</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#424754]/40">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-[#181c23]/70">
                    <td className="px-6 py-4 font-mono font-semibold">
                      {row.ticker}
                    </td>
                    <td className="px-6 py-4 text-[#c2c6d6]">
                      {row.sourceType}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase ${statusClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{row.filingsFound}</td>
                    <td className="px-6 py-4">{row.filingsProcessed}</td>
                    <td className="px-6 py-4">{row.filingsSkipped}</td>
                    <td className="px-6 py-4">{row.filingsFailed}</td>
                    <td className="px-6 py-4">{row.recordsCreated}</td>
                    <td className="px-6 py-4 text-[#c2c6d6]">
                      {row.startedAt
                        ? new Date(row.startedAt).toLocaleString()
                        : "--"}
                    </td>
                    <td className="max-w-[260px] truncate px-6 py-4 text-red-200">
                      {row.errorMessage ?? "--"}
                    </td>
                  </tr>
                ))}

                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-10 text-center text-[#8c909f]"
                    >
                      No scrape history yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
