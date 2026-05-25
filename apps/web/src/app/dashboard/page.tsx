import { AppShell } from "@/components/layout/AppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ActionBadge } from "@/components/ui/ActionBadge";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { DashboardBackendStatus } from "@/components/dashboard/DashboardBackendStatus";
import { TopMoneySignalScores } from "@/components/dashboard/TopMoneySignalScores";
import { RecentInstitutionalMoves } from "@/components/dashboard/RecentInstitutionalMoves";
import { RecentInsiderTrades } from "@/components/dashboard/RecentInsiderTrades";

const watchlist = [
  { ticker: "TSLA", change: "-1.42%", trend: "negative" },
  { ticker: "AMD", change: "+3.15%", trend: "positive" },
  { ticker: "AVGO", change: "+0.88%", trend: "positive" },
  { ticker: "PLTR", change: "+5.42%", trend: "positive" },
];

function AIMarketPulse() {
  return (
    <GlassPanel className="relative overflow-hidden border-t-2 border-t-[#6f00be]">
      <div className="flex items-center gap-2 border-b border-[#424754]/30 p-4">
        <MaterialIcon name="psychology" className="text-[22px] text-[#ddb7ff]" />
        <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
          AI Market Pulse
        </h2>
      </div>

      <div className="p-4">
        <div className="mb-4 rounded-[2px] border border-[#424754]/20 bg-[#0a0e16] p-4">
          <p className="text-[12px] leading-relaxed text-[#e0e2ed]">
            <strong className="font-medium text-[#adc6ff]">
              Institutional Rotation:
            </strong>{" "}
            Data indicates a significant shift from Megacap Tech into Mid-cap
            Energy. AI sentiment remains net positive but shows exhaustion in
            semiconductor manufacturing.
          </p>
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#c2c6d6]">
            Macro Sentiment
          </span>

          <div className="mt-2 flex h-1.5 w-full gap-1 overflow-hidden rounded-full">
            <div className="h-full flex-1 bg-[#4edea3]" />
            <div className="h-full flex-1 bg-[#4edea3]" />
            <div className="h-full flex-1 bg-[#4edea3]/50" />
            <div className="h-full flex-1 bg-[#424754]" />
            <div className="h-full flex-1 bg-[#424754]" />
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function AIAssistantButton() {
  return (
    <button className="flex w-full items-center justify-between rounded-[2px] border border-[#424754]/30 bg-[#181c23]/80 p-4 transition hover:border-[#adc6ff]">
      <div className="flex items-center gap-3">
        <MaterialIcon name="smart_toy" className="text-[24px] text-[#ddb7ff]" />
        <div className="text-left">
          <span className="block text-[12px] font-bold text-[#e0e2ed]">
            AI Assistant
          </span>
          <span className="block font-mono text-[10px] uppercase text-[#c2c6d6]">
            Institutional Support
          </span>
        </div>
      </div>

      <MaterialIcon name="arrow_forward" className="text-[22px] text-[#c2c6d6]" />
    </button>
  );
}

function WatchlistPreview() {
  return (
    <GlassPanel className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
          Watchlist Preview
        </h2>

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
        {watchlist.map((item) => (
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

export default function DashboardPage() {
  return (
    <AppShell activePage="Dashboard">
      <DashboardBackendStatus />

      <TopMoneySignalScores />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <RecentInstitutionalMoves />
          <RecentInsiderTrades />
          <WatchlistPreview />
        </div>

        <div className="flex flex-col gap-6">
          <AIMarketPulse />
          <AIAssistantButton />
        </div>
      </div>
    </AppShell>
  );
}