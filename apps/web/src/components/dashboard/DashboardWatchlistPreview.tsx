"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { useWatchlistPreview } from "@/hooks/useWatchlistPreview";

export function DashboardWatchlistPreview() {
  const { data, isLoading, isUsingFallback } = useWatchlistPreview();

  return (
    <GlassPanel className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
            Watchlist Preview
          </h2>

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
          <span className="rounded-[2px] bg-[#262a32] px-2 py-1 font-mono text-[10px] text-[#e0e2ed]">
            ● Tech Core
          </span>
          <span className="rounded-[2px] bg-[#262a32] px-2 py-1 font-mono text-[10px] text-[#c2c6d6]">
            ● Semi Feed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.map((item) => (
          <div
            key={item.ticker}
            className="rounded-[2px] border border-[#424754]/20 bg-[#0a0e16] p-3"
          >
            <div className="mb-2 flex items-start justify-between">
              <span className="text-[12px] font-bold text-[#e0e2ed]">
                {item.ticker}
              </span>

              <span
                className={
                  item.trend === "positive"
                    ? "font-mono text-[10px] text-[#4edea3]"
                    : "font-mono text-[10px] text-[#ffb4ab]"
                }
              >
                {item.change}
              </span>
            </div>

            <div className="mt-2 h-12 w-full">
              <svg
                className="h-full w-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 30"
              >
                <path
                  d={
                    item.trend === "positive"
                      ? "M0,25 L15,20 L30,22 L45,15 L60,10 L75,18 L90,5 L100,8"
                      : "M0,15 L10,18 L20,12 L30,22 L40,8 L50,15 L60,20 L70,10 L80,18 L90,12 L100,25"
                  }
                  fill="none"
                  stroke={item.trend === "positive" ? "#4edea3" : "#ffb4ab"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}