import { AppShell } from "@/components/layout/AppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ActionBadge } from "@/components/ui/ActionBadge";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const scoreCards = [
  { ticker: "GOOGL", company: "Alphabet Inc.", price: "$174.52", change: "+2.4%", score: 91 },
  { ticker: "NVDA", company: "Nvidia Corp.", price: "$128.61", change: "+4.1%", score: 88 },
  { ticker: "MSFT", company: "Microsoft Corp.", price: "$442.10", change: "+0.8%", score: 85 },
  { ticker: "META", company: "Meta Platforms", price: "$502.14", change: "+1.9%", score: 82 },
];

const institutionalMoves = [
  { institution: "BlackRock Inc.", ticker: "TSLA", action: "Accumulate", value: "$1.2B", time: "09:42 EST" },
  { institution: "Vanguard Group", ticker: "AAPL", action: "Accumulate", value: "$840M", time: "11:15 EST" },
  { institution: "Goldman Sachs", ticker: "NFLX", action: "Trim", value: "$420M", time: "13:22 EST" },
  { institution: "JPMorgan Chase", ticker: "AMD", action: "Accumulate", value: "$310M", time: "14:05 EST" },
];

const insiderTrades = [
  { insider: "Tim Cook", ticker: "AAPL", role: "CEO", action: "Sell", value: "$33.2M", date: "Today" },
  { insider: "Mark Zuckerberg", ticker: "META", role: "CEO", action: "Sell", value: "$18.5M", date: "Yesterday" },
  { insider: "Jensen Huang", ticker: "NVDA", role: "CEO", action: "Sell", value: "$24.1M", date: "2d ago" },
];

const watchlist = [
  { ticker: "TSLA", change: "-1.42%", trend: "negative" },
  { ticker: "AMD", change: "+3.15%", trend: "positive" },
  { ticker: "AVGO", change: "+0.88%", trend: "positive" },
  { ticker: "PLTR", change: "+5.42%", trend: "positive" },
];

function ScoreCard({
  ticker,
  company,
  price,
  change,
  score,
}: {
  ticker: string;
  company: string;
  price: string;
  change: string;
  score: number;
}) {
  return (
    <GlassPanel className="p-4 transition hover:border-[#adc6ff] hover:shadow-[0_0_8px_rgba(77,142,255,0.3)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-[18px] font-bold tracking-tight text-[#e0e2ed]">
            {ticker}
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase text-[#c2c6d6]">
            {company}
          </p>
        </div>

        <div className="rounded-[2px] border border-[#4edea3]/20 bg-[#4edea3]/10 px-2 py-1 font-mono text-[14px] font-bold text-[#4edea3]">
          {score}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase text-[#c2c6d6]">
            Price
          </p>
          <p className="text-[14px] font-medium text-[#e0e2ed]">{price}</p>
        </div>

        <div className="font-mono text-xs text-[#4edea3]">{change}</div>
      </div>
    </GlassPanel>
  );
}

function InstitutionalMovesTable() {
  return (
    <GlassPanel>
      <div className="flex items-center justify-between border-b border-[#424754]/30 p-4">
        <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
          Recent Institutional Moves
        </h2>
        <span className="font-mono text-[10px] uppercase text-[#c2c6d6]">
          Last 24 Hours
        </span>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#424754]/30 font-mono text-[10px] uppercase tracking-wider text-[#c2c6d6]">
            <th className="px-4 py-3 font-medium">Institution</th>
            <th className="px-4 py-3 font-medium">Ticker</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 text-right font-medium">Value</th>
            <th className="px-4 py-3 text-right font-medium">Time</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#424754]/20 font-mono text-[14px] text-[#e0e2ed]">
          {institutionalMoves.map((move) => (
            <tr key={`${move.institution}-${move.ticker}`} className="hover:bg-[#262a32]/50">
              <td className="px-4 py-3 text-[12px] font-medium">{move.institution}</td>
              <td className="px-4 py-3 text-[#adc6ff]">{move.ticker}</td>
              <td className="px-4 py-3">
                <ActionBadge action={move.action} />
              </td>
              <td className="px-4 py-3 text-right">{move.value}</td>
              <td className="px-4 py-3 text-right text-xs text-[#c2c6d6]">{move.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassPanel>
  );
}

function InsiderTradesTable() {
  return (
    <GlassPanel>
      <div className="flex items-center justify-between border-b border-[#424754]/30 p-4">
        <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
          Recent Insider Trades
        </h2>
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
          {insiderTrades.map((trade) => (
            <tr key={`${trade.insider}-${trade.ticker}`} className="hover:bg-[#262a32]/50">
              <td className="px-4 py-3 text-[12px] font-medium">{trade.insider}</td>
              <td className="px-4 py-3 text-[#adc6ff]">{trade.ticker}</td>
              <td className="px-4 py-3 text-xs text-[#c2c6d6]">{trade.role}</td>
              <td className="px-4 py-3">
                <ActionBadge action={trade.action} />
              </td>
              <td className="px-4 py-3 text-right">{trade.value}</td>
              <td className="px-4 py-3 text-right text-xs text-[#c2c6d6]">{trade.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassPanel>
  );
}

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
          <div key={item.ticker} className="rounded-[2px] border border-[#424754]/20 bg-[#0a0e16] p-3">
            <div className="mb-2 flex items-start justify-between">
              <span className="text-[12px] font-bold text-[#e0e2ed]">{item.ticker}</span>
              <span className={item.trend === "positive" ? "font-mono text-[10px] text-[#4edea3]" : "font-mono text-[10px] text-[#ffb4ab]"}>
                {item.change}
              </span>
            </div>

            <div className="mt-2 h-12 w-full">
              <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 30">
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
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#e0e2ed]">
            <MaterialIcon name="stars" fill className="text-[22px] text-[#adc6ff]" />
            <h2 className="text-[18px] font-semibold">Top MoneySignal Scores</h2>
          </div>

          <a className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6] hover:text-[#adc6ff]" href="#">
            View All Tickers
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {scoreCards.map((card) => (
            <ScoreCard key={card.ticker} {...card} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <InstitutionalMovesTable />
          <InsiderTradesTable />
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