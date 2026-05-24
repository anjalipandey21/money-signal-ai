import Link from "next/link";

const scoreCards = [
  {
    ticker: "GOOGL",
    company: "Alphabet Inc.",
    price: "$174.52",
    change: "+2.4%",
    score: 91,
  },
  {
    ticker: "NVDA",
    company: "Nvidia Corp.",
    price: "$128.61",
    change: "+4.1%",
    score: 88,
  },
  {
    ticker: "MSFT",
    company: "Microsoft Corp.",
    price: "$442.10",
    change: "+0.8%",
    score: 85,
  },
  {
    ticker: "META",
    company: "Meta Platforms",
    price: "$502.14",
    change: "+1.9%",
    score: 82,
  },
];

const institutionalMoves = [
  {
    institution: "BlackRock Inc.",
    ticker: "TSLA",
    action: "Accumulate",
    value: "$1.2B",
    time: "09:42 EST",
  },
  {
    institution: "Vanguard Group",
    ticker: "AAPL",
    action: "Accumulate",
    value: "$840M",
    time: "11:15 EST",
  },
  {
    institution: "Goldman Sachs",
    ticker: "NFLX",
    action: "Trim",
    value: "$420M",
    time: "13:22 EST",
  },
  {
    institution: "JPMorgan Chase",
    ticker: "AMD",
    action: "Accumulate",
    value: "$310M",
    time: "14:05 EST",
  },
];

const insiderTrades = [
  {
    insider: "Tim Cook",
    ticker: "AAPL",
    role: "CEO",
    action: "Sell",
    value: "$33.2M",
    date: "Today",
  },
  {
    insider: "Mark Zuckerberg",
    ticker: "META",
    role: "CEO",
    action: "Sell",
    value: "$18.5M",
    date: "Yesterday",
  },
  {
    insider: "Jensen Huang",
    ticker: "NVDA",
    role: "CEO",
    action: "Sell",
    value: "$24.1M",
    date: "2d ago",
  },
];

const watchlist = [
  {
    ticker: "TSLA",
    change: "-1.42%",
    trend: "negative",
    path: "M0,15 L10,18 L20,12 L30,22 L40,8 L50,15 L60,20 L70,10 L80,18 L90,12 L100,25",
  },
  {
    ticker: "AMD",
    change: "+3.15%",
    trend: "positive",
    path: "M0,25 L15,20 L30,22 L45,15 L60,10 L75,18 L90,5 L100,8",
  },
  {
    ticker: "AVGO",
    change: "+0.88%",
    trend: "positive",
    path: "M0,20 L20,18 L40,22 L60,15 L80,12 L100,5",
  },
  {
    ticker: "PLTR",
    change: "+5.42%",
    trend: "positive",
    path: "M0,28 L15,15 L30,22 L45,10 L60,18 L75,8 L90,12 L100,2",
  },
];

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "▦", active: true },
  { label: "Signals Feed", href: "/signals", icon: "▥" },
  { label: "Stocks", href: "/stocks/NVDA", icon: "╱" },
  { label: "Funds", href: "/funds", icon: "⌂" },
  { label: "Insider Trades", href: "/insiders", icon: "♙" },
  { label: "Watchlist", href: "/watchlist", icon: "★" },
  { label: "Alerts", href: "/alerts", icon: "♢" },
];

const comingSoonItems = [
  { label: "Congressional Trades", icon: "◎" },
  { label: "Activist Signals", icon: "◌" },
  { label: "Buybacks", icon: "▱" },
];

const systemItems = [
  { label: "Methodology", href: "/methodology", icon: "⚗" },
  { label: "Settings", href: "/settings", icon: "⚙" },
  { label: "Support", href: "/support", icon: "?" },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[240px] flex-col border-r border-[#424754]/60 bg-[#10131b] md:flex">
      <div className="border-b border-[#424754]/30 p-6 pb-8">
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#adc6ff]">
          MoneySignal AI
        </h1>
        <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.16em] text-[#c2c6d6]">
          Institutional Grade
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-[14px] transition ${
                item.active
                  ? "border-r-2 border-[#adc6ff] bg-[#4d8eff]/10 font-medium text-[#adc6ff]"
                  : "text-[#c2c6d6] hover:bg-[#262a32] hover:text-[#e0e2ed]"
              }`}
            >
              <span className="w-5 text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-4 border-t border-[#424754]/30 px-4 py-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8c909f]">
            Coming Soon
          </p>
        </div>

        <div className="space-y-1">
          {comingSoonItems.map((item) => (
            <div
              key={item.label}
              className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-[14px] text-[#8c909f] opacity-50"
            >
              <span className="w-5 text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-[#424754]/30 px-4 py-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8c909f]">
            System
          </p>
        </div>

        <div className="space-y-1">
          {systemItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-[14px] text-[#c2c6d6] transition hover:bg-[#262a32] hover:text-[#e0e2ed]"
            >
              <span className="w-5 text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function Topbar() {
  return (
    <nav className="fixed right-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#424754]/60 bg-[#10131b] px-4 md:w-[calc(100%-240px)]">
      <div className="flex w-full max-w-2xl items-center gap-4">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#c2c6d6]">
            ⌕
          </span>
          <input
            className="h-10 w-full rounded-[2px] border border-[#424754] bg-[#181c23] pl-10 pr-4 text-[13px] text-[#e0e2ed] outline-none placeholder:text-[#c2c6d6]/50 focus:border-[#adc6ff]"
            placeholder="Search tickers, funds, insiders, or signals..."
            type="text"
          />
        </div>
      </div>

      <div className="hidden items-center gap-6 md:flex">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#4edea3]">
          <span className="h-2 w-2 rounded-full bg-[#4edea3]" />
          Live Market Feed
        </div>

        <div className="flex items-center gap-4 text-[#c2c6d6]">
          <button className="relative transition hover:text-[#adc6ff]">
            ♢
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#ffb4ab]" />
          </button>
          <button className="transition hover:text-[#adc6ff]">⚙</button>
        </div>

        <div className="flex items-center gap-3 border-l border-[#424754] pl-4">
          <div className="text-right">
            <div className="text-[14px] font-medium text-[#e0e2ed]">
              BD Analyst
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#c2c6d6]">
              Institutional
            </div>
          </div>
          <div className="h-8 w-8 rounded-full border border-[#424754] bg-[#181c23]" />
        </div>
      </div>
    </nav>
  );
}

function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2px] border border-[#424754]/30 bg-[#181c23]/80 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

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
    <GlassPanel className="group p-4 transition hover:border-[#adc6ff] hover:shadow-[0_0_8px_rgba(77,142,255,0.3)]">
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

function ActionBadge({ action }: { action: string }) {
  const positive = action.toLowerCase() === "accumulate";

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
        positive
          ? "bg-[#4edea3]/10 text-[#4edea3]"
          : "bg-[#ffb4ab]/10 text-[#ffb4ab]"
      }`}
    >
      {action}
    </span>
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

      <div className="overflow-x-auto">
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
              <tr
                key={`${move.institution}-${move.ticker}`}
                className="transition hover:bg-[#262a32]/50"
              >
                <td className="px-4 py-3 text-[12px] font-medium">
                  {move.institution}
                </td>
                <td className="px-4 py-3 text-[#adc6ff]">{move.ticker}</td>
                <td className="px-4 py-3">
                  <ActionBadge action={move.action} />
                </td>
                <td className="px-4 py-3 text-right">{move.value}</td>
                <td className="px-4 py-3 text-right text-xs text-[#c2c6d6]">
                  {move.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

      <div className="overflow-x-auto">
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
              <tr
                key={`${trade.insider}-${trade.ticker}`}
                className="transition hover:bg-[#262a32]/50"
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
      </div>
    </GlassPanel>
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
          <span className="flex items-center gap-1 rounded-[2px] bg-[#262a32] px-2 py-1 font-mono text-[10px] text-[#e0e2ed]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#adc6ff]" />
            Tech Core
          </span>
          <span className="flex items-center gap-1 rounded-[2px] bg-[#262a32] px-2 py-1 font-mono text-[10px] text-[#c2c6d6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#424754]" />
            Semi Feed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {watchlist.map((item) => (
          <div
            key={item.ticker}
            className="relative overflow-hidden rounded-[2px] border border-[#424754]/20 bg-[#0a0e16] p-3 transition hover:border-[#adc6ff]/50"
          >
            <div className="mb-2 flex items-start justify-between">
              <span className="text-[12px] font-bold text-[#e0e2ed]">
                {item.ticker}
              </span>
              <span
                className={`font-mono text-[10px] ${
                  item.trend === "positive"
                    ? "text-[#4edea3]"
                    : "text-[#ffb4ab]"
                }`}
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
                  d={item.path}
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

function AIMarketPulse() {
  return (
    <GlassPanel className="relative overflow-hidden border-t-2 border-t-[#6f00be]">
      <div className="pointer-events-none absolute left-0 top-0 h-32 w-full bg-[#6f00be]/10 blur-2xl" />

      <div className="relative z-10 flex items-center gap-2 border-b border-[#424754]/30 p-4">
        <span className="text-xl text-[#ddb7ff]">☮</span>
        <h2 className="text-[18px] font-semibold text-[#e0e2ed]">
          AI Market Pulse
        </h2>
      </div>

      <div className="relative z-10 p-4">
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

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#c2c6d6]">
            Macro Sentiment
          </span>

          <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full">
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
        <span className="text-2xl text-[#ddb7ff]">☷</span>
        <div className="text-left">
          <span className="block text-[12px] font-bold tracking-tight text-[#e0e2ed]">
            AI Assistant
          </span>
          <span className="block font-mono text-[10px] uppercase text-[#c2c6d6]">
            Institutional Support
          </span>
        </div>
      </div>

      <span className="text-[#c2c6d6]">→</span>
    </button>
  );
}

function Footer() {
  return (
    <footer className="relative z-30 mt-auto flex w-full flex-col items-center justify-between gap-2 border-t border-[#424754] bg-[#0a0e16] px-4 py-4 text-[#c2c6d6] md:ml-[240px] md:w-[calc(100%-240px)] md:flex-row">
      <div className="flex items-center gap-2 font-mono text-[12px] uppercase">
        <span>ⓘ</span>
        <span>© 2024 MoneySignal AI. Institutional Intelligence.</span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-wider">
        <span>Research intelligence only. Not financial advice.</span>
        <span className="hidden text-[#424754] md:inline">|</span>
        <Link href="#" className="hover:text-[#adc6ff]">
          Privacy Policy
        </Link>
        <span className="hidden text-[#424754] md:inline">|</span>
        <Link href="#" className="hover:text-[#adc6ff]">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen overflow-x-auto bg-[#10131b] text-[#e0e2ed]">
      <Sidebar />
      <Topbar />

      <main className="min-w-[1040px] flex-1 overflow-x-hidden p-4 pt-20 md:ml-[240px] md:p-6 md:pt-[88px]">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#e0e2ed]">
                <span className="text-[#adc6ff]">✦</span>
                <h2 className="text-[18px] font-semibold">
                  Top MoneySignal Scores
                </h2>
              </div>

              <Link
                href="#"
                className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6] transition hover:text-[#adc6ff]"
              >
                View All Tickers
              </Link>
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
        </div>
      </main>

      <Footer />
    </div>
  );
}