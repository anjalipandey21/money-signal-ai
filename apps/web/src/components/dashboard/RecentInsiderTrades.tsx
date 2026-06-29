"use client";

import { ActionBadge } from "@/components/ui/ActionBadge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useInsiderTrades } from "@/hooks/useInsiderTrades";

export function RecentInsiderTrades() {
  const { data, isLoading, isUsingFallback } = useInsiderTrades();

  return (
    <GlassPanel>
      <div className="flex items-center justify-between border-b border-[#424754]/30 p-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
            Recent Insider Trades
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

        <span className="font-mono text-[10px] uppercase text-[#c2c6d6]">
          Latest Filings
        </span>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#424754]/30 font-mono text-[10px] uppercase tracking-wider text-[#c2c6d6]">
            <th className="px-4 py-3 font-medium">Insider</th>
            <th className="px-4 py-3 font-medium">Ticker</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 text-right font-medium">Value</th>
            <th className="px-4 py-3 text-right font-medium">Date</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#424754]/20 font-mono text-[14px] text-[#e0e2ed]">
          {data.map((trade, index) => (
            <tr
              key={`${trade.insider}-${trade.ticker}-${trade.date}-${trade.value}-${index}`}
              className="hover:bg-[#262a32]/50"
            >
              <td className="px-4 py-3 text-[12px] font-medium">
                {trade.insider}
              </td>
              <td className="px-4 py-3 text-[#adc6ff]">{trade.ticker}</td>
              <td className="px-4 py-3 text-xs text-[#c2c6d6]">
                {trade.role}
              </td>
              <td className="px-4 py-3">
                <ActionBadge action={trade.action} />
              </td>
              <td className="px-4 py-3 text-right">{trade.value}</td>
              <td className="px-4 py-3 text-right text-xs text-[#c2c6d6]">
                {trade.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassPanel>
  );
}
