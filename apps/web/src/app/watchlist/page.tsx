import { AppShell } from "@/components/layout/AppShell";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const watchlistRows = [
  {
    ticker: "NVDA",
    company: "NVIDIA Corp",
    sector: "Technology",
    price: "$875.28",
    score: 92,
    scoreChange: "4.2",
    scoreTrend: "up",
    signal: "Insider Accumulation",
    signalTone: "purple",
    updated: "2h ago",
  },
  {
    ticker: "PLTR",
    company: "Palantir Tech",
    sector: "Software",
    price: "$24.15",
    score: 88,
    scoreChange: "1.5",
    scoreTrend: "up",
    signal: "Institutional Buy",
    signalTone: "blue",
    updated: "4h ago",
  },
  {
    ticker: "TSLA",
    company: "Tesla Inc",
    sector: "Automotive",
    price: "$175.34",
    score: 45,
    scoreChange: "2.1",
    scoreTrend: "down",
    signal: "Heavy Distribution",
    signalTone: "red",
    updated: "1d ago",
  },
  {
    ticker: "CRWD",
    company: "CrowdStrike",
    sector: "Cybersecurity",
    price: "$310.22",
    score: 72,
    scoreChange: "0.0",
    scoreTrend: "flat",
    signal: "No recent signals",
    signalTone: "none",
    updated: "2d ago",
  },
];

function SignalBadge({
  signal,
  tone,
}: {
  signal: string;
  tone: string;
}) {
  if (tone === "none") {
    return (
      <span className="font-mono text-[12px] text-[#c2c6d6]">
        {signal}
      </span>
    );
  }

  const classes =
    tone === "purple"
      ? "border-[#6f00be]/40 bg-[#6f00be]/20 text-[#d6a9ff]"
      : tone === "blue"
        ? "border-[#4d8eff]/40 bg-[#4d8eff]/20 text-[#adc6ff]"
        : "border-[#93000a]/40 bg-[#93000a]/20 text-[#ffb4ab]";

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${classes}`}
    >
      {signal}
    </span>
  );
}

function ScoreChange({
  trend,
  value,
}: {
  trend: string;
  value: string;
}) {
  if (trend === "up") {
    return (
      <span className="flex items-center text-[11px] text-[#4edea3]">
        <MaterialIcon name="arrow_upward" className="text-[14px]" />
        {value}
      </span>
    );
  }

  if (trend === "down") {
    return (
      <span className="flex items-center text-[11px] text-[#ffb4ab]">
        <MaterialIcon name="arrow_downward" className="text-[14px]" />
        {value}
      </span>
    );
  }

  return (
    <span className="flex items-center text-[11px] text-[#c2c6d6]">
      <MaterialIcon name="remove" className="text-[14px]" />
      {value}
    </span>
  );
}

function ScoreValue({
  score,
  trend,
}: {
  score: number;
  trend: string;
}) {
  const color =
    trend === "up"
      ? "text-[#4edea3]"
      : trend === "down"
        ? "text-[#ffb4ab]"
        : "text-[#e0e2ed]";

  return <span className={`font-mono text-[14px] ${color}`}>{score}</span>;
}

function WatchlistTable() {
  return (
    <section className="relative overflow-hidden rounded border border-[#1E293B] bg-[#0D121F] transition-all hover:border-[#3B82F6]/50 hover:shadow-[0_0_4px_1px_rgba(59,130,246,0.3)]">
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#A855F7]/50 to-transparent" />

      <div className="flex items-center justify-between border-b border-[#1E293B] px-4 py-3">
        <h3 className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
          Monitored Assets
        </h3>

        <button className="flex items-center gap-1 text-[14px] text-[#c2c6d6] transition-colors hover:text-[#adc6ff]">
          <MaterialIcon name="filter_list" className="text-[16px]" />
          Filter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-[#1E293B]">
              <th className="w-[70px] px-2 py-3 font-mono text-[12px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Ticker
              </th>
              <th className="px-2 py-3 font-mono text-[12px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Company
              </th>
              <th className="w-[100px] px-2 py-3 font-mono text-[12px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Sector
              </th>
              <th className="w-[90px] px-2 py-3 font-mono text-[12px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Price
              </th>
              <th className="w-[120px] px-2 py-3 font-mono text-[12px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                MoneySignal Score
              </th>
              <th className="px-2 py-3 font-mono text-[12px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Latest Signal
              </th>
              <th className="w-[80px] px-2 py-3 font-mono text-[12px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Last Updated
              </th>
              <th className="w-[80px] px-2 py-3 text-right font-mono text-[12px] font-normal uppercase tracking-wider text-[#c2c6d6]">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="text-[14px]">
            {watchlistRows.map((row) => (
              <tr
                key={row.ticker}
                className="group border-b border-[#1E293B] transition-colors last:border-b-0 hover:bg-[#181c23]"
              >
                <td className="px-2 py-4">
                  <div className="inline-block rounded border border-[#424754] bg-[#10131b] px-2 py-1 font-mono text-[14px] text-[#e0e2ed]">
                    {row.ticker}
                  </div>
                </td>

                <td className="whitespace-normal px-2 py-4 font-medium text-[#e0e2ed]">
                  {row.company}
                </td>

                <td className="px-2 py-4 text-[#c2c6d6]">
                  {row.sector}
                </td>

                <td className="px-2 py-4 font-mono text-[#e0e2ed]">
                  {row.price}
                </td>

                <td className="px-2 py-4">
                  <div className="flex items-center gap-2">
                    <ScoreValue score={row.score} trend={row.scoreTrend} />
                    <ScoreChange trend={row.scoreTrend} value={row.scoreChange} />
                  </div>
                </td>

                <td className="whitespace-normal px-2 py-4">
                  <SignalBadge signal={row.signal} tone={row.signalTone} />
                </td>

                <td className="px-2 py-4 font-mono text-xs text-[#c2c6d6]">
                  {row.updated}
                </td>

                <td className="px-2 py-4 text-right">
                  <button className="flex w-full items-center justify-end gap-1 text-[#c2c6d6] transition-colors group-hover:text-[#adc6ff]">
                    View
                    <MaterialIcon name="chevron_right" className="text-[16px]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WatchlistIntelligenceCard() {
  return (
    <section className="relative overflow-hidden rounded border border-[#1E293B] bg-[#0D121F] p-5 shadow-[0_0_8px_1px_rgba(168,85,247,0.2)]">
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#A855F7] to-transparent" />

      <div className="mb-4 flex items-center gap-2">
        <MaterialIcon
          name="auto_awesome"
          fill
          className="text-[24px] text-[#ddb7ff]"
        />
        <h3 className="text-[18px] font-semibold leading-6 text-[#e0e2ed]">
          Watchlist Intelligence
        </h3>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-[#c2c6d6]">
        Your tracked assets show a strong correlation with recent semiconductor
        sector rotation. NVDA and PLTR are exhibiting highly anomalous
        institutional buying patterns relative to their 30-day moving averages.
      </p>

      <div className="rounded border border-[#424754] bg-[#10131b] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[12px] uppercase tracking-wide text-[#c2c6d6]">
            Portfolio Sentiment
          </span>
          <span className="text-xs font-medium text-[#4edea3]">
            Bullish
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#262a32]">
          <div className="h-full w-[75%] bg-[#4edea3]" />
        </div>
      </div>
    </section>
  );
}

function SectorHeatmapCard() {
  return (
    <section className="relative flex h-[200px] flex-col items-center justify-center rounded border border-[#1E293B] bg-[#0D121F] p-6 text-center transition-all hover:border-[#3B82F6]/50 hover:shadow-[0_0_4px_1px_rgba(59,130,246,0.3)]">
      <span className="absolute right-3 top-3 rounded border border-[#424754] bg-[#262a32] px-2 py-1 font-mono text-[10px] uppercase text-[#c2c6d6]">
        Coming Soon
      </span>

      <MaterialIcon name="grid_view" className="mb-3 text-[32px] text-[#8c909f]" />

      <h3 className="mb-2 text-[18px] font-semibold leading-6 text-[#e0e2ed]">
        Sector Heatmap
      </h3>

      <p className="mb-4 text-sm text-[#c2c6d6]">
        Add more tickers across different sectors to generate correlation
        heatmaps.
      </p>

      <button className="cursor-not-allowed text-sm font-medium text-[#adc6ff] opacity-50">
        Explore Sectors
      </button>
    </section>
  );
}

export default function WatchlistPage() {
  return (
    <AppShell activePage="Watchlist">
      <section className="mb-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#e0e2ed]">
              Watchlist
            </h1>

            <span className="h-3 w-3 animate-pulse rounded-full bg-[#6ffbbe] shadow-[0_0_8px_rgba(111,251,190,0.4)]" />
          </div>

          <p className="text-[14px] text-[#c2c6d6]">
            Monitoring active tickers for institutional and insider money
            movement.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[14px] text-[#c2c6d6]">
            <span>Alert Settings</span>

            <button className="relative flex h-4 w-8 items-center rounded-full bg-[#4d8eff] px-0.5">
              <span className="absolute right-0.5 h-3 w-3 rounded-full bg-[#10131b] shadow-sm" />
            </button>
          </div>

          <button className="flex items-center gap-2 rounded bg-[#3B82F6] px-4 py-1.5 font-medium text-white transition-colors hover:bg-blue-600">
            <MaterialIcon name="add" className="text-sm" />
            Add Stock
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WatchlistTable />
        </div>

        <aside className="space-y-6">
          <WatchlistIntelligenceCard />
          <SectorHeatmapCard />
        </aside>
      </section>

      <p className="pt-10 text-center text-sm text-[#c2c6d6]">
        Research only. Not financial advice.
      </p>
    </AppShell>
  );
}