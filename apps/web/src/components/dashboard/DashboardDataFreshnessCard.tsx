"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  getScrapeHistory,
  type ScrapeHistoryItem,
} from "@/lib/moneySignalApi";

type FreshnessStatus = "Fresh" | "Stale" | "Error" | "Unknown";

const showAdminLink = process.env.NEXT_PUBLIC_SHOW_ADMIN_LINK === "true";

function statusStyle(status: FreshnessStatus) {
  if (status === "Fresh") {
    return "border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]";
  }

  if (status === "Stale") {
    return "border-[#f4c542]/40 bg-[#f4c542]/10 text-[#f4c542]";
  }

  if (status === "Error") {
    return "border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]";
  }

  return "border-[#8c909f]/40 bg-[#8c909f]/10 text-[#c2c6d6]";
}

function formatRunTime(value?: string | null) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getFreshnessStatus(run?: ScrapeHistoryItem): FreshnessStatus {
  if (!run) return "Unknown";

  if (run.status.includes("failed") || run.filingsFailed > 0) {
    return "Error";
  }

  const runTime = run.completedAt ?? run.startedAt;
  if (!runTime) return "Unknown";

  const date = new Date(runTime);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const ageHours = (Date.now() - date.getTime()) / 3_600_000;

  return ageHours <= 24 ? "Fresh" : "Stale";
}

export function DashboardDataFreshnessCard() {
  const [history, setHistory] = useState<ScrapeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getScrapeHistory(1);

        if (!isMounted) return;

        setHistory(response);
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load ingestion history"
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const latestRun = history[0];
  const freshness = useMemo(() => getFreshnessStatus(latestRun), [latestRun]);

  return (
    <div className="relative overflow-hidden rounded border border-[#424754]/50 bg-[#0a0e16] p-5">
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#adc6ff]/70 to-transparent" />

      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-[#adc6ff]/40 bg-[#adc6ff]/10 text-[#adc6ff]">
            <MaterialIcon name="sync_alt" className="text-[22px]" />
          </div>

          <div>
            <h3 className="text-[18px] font-semibold text-[#e0e2ed]">
              Data Freshness
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-[#8c909f]">
              Latest ingestion pipeline health and scrape history.
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${statusStyle(
            freshness
          )}`}
        >
          {isLoading ? "Loading" : freshness}
        </span>
      </div>

      {error ? (
        <div className="rounded border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 p-3 text-[13px] leading-5 text-[#ffb4ab]">
          {error}
        </div>
      ) : latestRun ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Source" value={latestRun.sourceType} />
            <Metric label="Status" value={latestRun.status} />
            <Metric
              label="Records"
              value={latestRun.recordsCreated.toLocaleString()}
            />
            <Metric
              label="Skipped / Failed"
              value={`${latestRun.filingsSkipped} / ${latestRun.filingsFailed}`}
            />
          </div>

          <div className="rounded border border-[#424754]/40 bg-[#111620] px-3 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8c909f]">
              Last run
            </p>
            <p className="mt-1 text-[13px] text-[#e0e2ed]">
              {formatRunTime(latestRun.completedAt ?? latestRun.startedAt)}
            </p>
          </div>

          {showAdminLink ? (
            <Link
              href="/admin/scraper"
              className="inline-flex w-fit rounded border border-[#424754] bg-[#181c23] px-3 py-2 text-[12px] font-semibold text-[#e0e2ed] transition hover:border-[#adc6ff]"
            >
              View Data Ops
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="rounded border border-[#424754]/40 bg-[#111620] p-4 text-[13px] text-[#c2c6d6]">
          No ingestion runs yet.
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#424754]/40 bg-[#111620] p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8c909f]">
        {label}
      </p>
      <p className="mt-1 truncate text-[13px] font-semibold text-[#e0e2ed]">
        {value}
      </p>
    </div>
  );
}
