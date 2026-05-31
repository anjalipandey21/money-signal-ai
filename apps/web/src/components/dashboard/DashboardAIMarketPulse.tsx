"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useAIMarketPulse } from "@/hooks/useAIMarketPulse";

export function DashboardAIMarketPulse() {
  const { data, isLoading, isUsingFallback } = useAIMarketPulse();

  const filledBars = Math.ceil(data.sentimentScore / 20);

  return (
    <GlassPanel className="relative overflow-hidden border-t-2 border-t-[#6f00be]">
      <div className="flex items-center justify-between border-b border-[#424754]/30 p-4">
        <div className="flex items-center gap-2">
          <MaterialIcon name="psychology" className="text-[22px] text-[#ddb7ff]" />
          <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
            AI Market Pulse
          </h2>
        </div>

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

      <div className="p-4">
        <div className="mb-4 rounded-[2px] border border-[#424754]/20 bg-[#0a0e16] p-4">
          <p className="text-[12px] leading-relaxed text-[#e0e2ed]">
            <strong className="font-medium text-[#adc6ff]">
              {data.title}:
            </strong>{" "}
            {data.summary}
          </p>
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#c2c6d6]">
            {data.sentimentLabel}
          </span>

          <div className="mt-2 flex h-1.5 w-full gap-1 overflow-hidden rounded-full">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                className={`h-full flex-1 ${
                  bar <= filledBars ? "bg-[#4edea3]" : "bg-[#424754]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}