"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useMarketDataHealth } from "@/hooks/useMarketDataHealth";

function statusStyle(status: "fresh" | "stale" | "outdated" | "pending") {
  if (status === "fresh") {
    return "border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]";
  }

  if (status === "stale") {
    return "border-[#f4c542]/40 bg-[#f4c542]/10 text-[#f4c542]";
  }

  if (status === "outdated") {
    return "border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]";
  }

  return "border-[#8c909f]/40 bg-[#8c909f]/10 text-[#c2c6d6]";
}

function metricLabel(label: string, value: number, total: number) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return `${label}: ${value} (${percentage}%)`;
}

export function DashboardDataHealthCard() {
  const { data, isLoading, isUsingFallback } = useMarketDataHealth();

  const { summary, items } = data;

  const latestItems = items.slice(0, 5);

  return (
    <div className="relative overflow-hidden rounded border border-[#424754]/50 bg-[#0a0e16] p-5">
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#4d8eff]/70 to-transparent" />

      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-[#4d8eff]/40 bg-[#4d8eff]/10 text-[#adc6ff]">
            <MaterialIcon name="database" className="text-[22px]" />
          </div>

          <div>
            <h3 className="text-[18px] font-semibold text-[#e0e2ed]">
              Market Data Health
            </h3>

            <p className="mt-1 text-[13px] leading-5 text-[#8c909f]">
              Tracks freshness of database-backed stock price snapshots.
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
            isUsingFallback
              ? "border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]"
              : "border border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]"
          }`}
        >
          {isLoading ? "Loading" : isUsingFallback ? "Fallback" : "Live"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <HealthMetric
          label="Fresh"
          value={summary.fresh}
          total={summary.total}
          status="fresh"
        />

        <HealthMetric
          label="Stale"
          value={summary.stale}
          total={summary.total}
          status="stale"
        />

        <HealthMetric
          label="Outdated"
          value={summary.outdated}
          total={summary.total}
          status="outdated"
        />

        <HealthMetric
          label="Pending"
          value={summary.pending}
          total={summary.total}
          status="pending"
        />
      </div>

      <div className="mt-5 rounded border border-[#424754]/40 bg-[#111620]">
        <div className="border-b border-[#424754]/40 px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#c2c6d6]">
            Latest tracked symbols
          </p>
        </div>

        <div className="divide-y divide-[#424754]/25">
          {latestItems.length > 0 ? (
            latestItems.map((item) => (
              <div
                key={item.ticker}
                className="flex items-center justify-between gap-3 px-3 py-3"
              >
                <div>
                  <p className="font-mono text-[13px] font-bold text-[#e0e2ed]">
                    {item.ticker}
                  </p>

                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[#8c909f]">
                    {item.companyName}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${statusStyle(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>

                  <p className="mt-1 font-mono text-[10px] text-[#8c909f]">
                    {item.ageMinutes === null
                      ? "No snapshot"
                      : `${item.ageMinutes}m old`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-5 text-center text-[13px] text-[#8c909f]">
              No market snapshot data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  total,
  status,
}: {
  label: string;
  value: number;
  total: number;
  status: "fresh" | "stale" | "outdated" | "pending";
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className={`rounded border p-3 ${statusStyle(status)}`}>
      <p className="font-mono text-[10px] uppercase tracking-wider opacity-80">
        {metricLabel(label, value, total)}
      </p>

      <p className="mt-1 text-[24px] font-semibold">{percentage}%</p>
    </div>
  );
}