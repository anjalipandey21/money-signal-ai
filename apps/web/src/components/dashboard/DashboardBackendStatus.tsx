"use client";

import { useDashboardSummary } from "@/hooks/useDashboardSummary";

export function DashboardBackendStatus() {
  const { data, isLoading, isUsingFallback } = useDashboardSummary();

  return (
    <div className="rounded-xl border border-[#424754]/50 bg-[#0d121f] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
          Backend Integration Status
        </p>

        <span
          className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
            isUsingFallback
              ? "border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]"
              : "border border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]"
          }`}
        >
          {isLoading
            ? "Loading"
            : isUsingFallback
              ? "Fallback Data"
              : "Live Backend"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="MoneySignal Score" value={data.moneySignalScore} />
        <Metric label="Active Signals" value={data.activeSignals} />
        <Metric label="Bullish" value={data.bullishSignals} />
        <Metric label="Bearish" value={data.bearishSignals} />
        <Metric label="Watchlist" value={data.watchlistCount} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[#424754]/40 bg-[#181c23] p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
        {label}
      </p>
      <p className="mt-1 text-[24px] font-semibold text-[#e0e2ed]">{value}</p>
    </div>
  );
}