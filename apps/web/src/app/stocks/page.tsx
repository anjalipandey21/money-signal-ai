import { AppShell } from "@/components/layout/AppShell";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type StockPageProps = {
  params: Promise<{
    ticker: string;
  }>;
};

const factors = [
  {
    label: "Institutional Flow",
    value: 98,
    color: "bg-[#4edea3]",
    textColor: "text-[#4edea3]",
  },
  {
    label: "Multi-Fund Presence",
    value: 94,
    color: "bg-[#4edea3]",
    textColor: "text-[#4edea3]",
  },
  {
    label: "Signal Freshness",
    value: 85,
    color: "bg-[#adc6ff]",
    textColor: "text-[#adc6ff]",
  },
  {
    label: "Insider Selling",
    value: 22,
    color: "bg-[#ffb4ab]",
    textColor: "text-[#ffb4ab]",
  },
  {
    label: "Confidence",
    value: 88,
    color: "bg-[#adc6ff]",
    textColor: "text-[#adc6ff]",
  },
];

const timeline = [
  {
    label: "Options Flow",
    time: "2h ago",
    text: "Unusual Call Volume detected at $950 strike exp. 03/15.",
    color: "border-[#6f00be]",
    badge: "bg-[#6f00be]/20 text-[#ddb7ff] border-[#6f00be]/30",
  },
  {
    label: "Analyst Action",
    time: "5h ago",
    text: "Goldman Sachs reiterates Conviction Buy, raises PT to $1000.",
    color: "border-[#4edea3]",
    badge: "bg-[#00a572]/20 text-[#4edea3] border-[#00a572]/30",
  },
  {
    label: "News Context",
    time: "1d ago",
    text: "Meta announces major infrastructure build-out utilizing H100s.",
    color: "border-[#adc6ff]",
    badge: "bg-[#31353d] text-[#e0e2ed] border-[#424754]",
  },
  {
    label: "13F Update",
    time: "2d ago",
    text: "Top 50 funds increased positions by 14% QoQ.",
    color: "border-[#adc6ff]",
    badge: "bg-[#adc6ff]/20 text-[#adc6ff] border-[#adc6ff]/30",
  },
  {
    label: "Form 4",
    time: "3d ago",
    text: "CEO Huang Jen Hsun sold 100K shares ($24.5M) via 10b5-1.",
    color: "border-[#ffb4ab]",
    badge: "bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30",
  },
];

const fundMovement = [
  {
    institution: "Renaissance Technologies",
    action: "New",
    change: "+1.2M",
    tone: "green",
  },
  {
    institution: "Two Sigma Advisers",
    action: "Add",
    change: "+450K",
    tone: "blue",
  },
  {
    institution: "Bridgewater Associates",
    action: "Reduce",
    change: "-120K",
    tone: "red",
  },
];

const insiderTrades = [
  {
    insider: "Huang Jen Hsun (CEO)",
    type: "Sale (10b5-1)",
    value: "$24.5M",
    tone: "neutral",
  },
  {
    insider: "Kress Colette (CFO)",
    type: "Sale (10b5-1)",
    value: "$8.2M",
    tone: "neutral",
  },
  {
    insider: "Stevens Mark A (Dir)",
    type: "Grant",
    value: "$1.1M",
    tone: "blue",
  },
];

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "purple" | "red" | "neutral";
}) {
  const classes = {
    green: "border-[#4edea3]/20 bg-[#4edea3]/10 text-[#4edea3]",
    blue: "border-[#adc6ff]/20 bg-[#adc6ff]/10 text-[#adc6ff]",
    purple: "border-[#6f00be]/30 bg-[#6f00be]/20 text-[#ddb7ff]",
    red: "border-[#ffb4ab]/20 bg-[#ffb4ab]/10 text-[#ffb4ab]",
    neutral: "border-[#424754] bg-[#31353d] text-[#c2c6d6]",
  };

  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function ScoreRing() {
  return (
    <div className="flex items-center gap-4 rounded border border-[#424754] bg-[#181c23] p-3">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-[#31353d]"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-[#4edea3]"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeDasharray="92, 100"
            strokeWidth="3"
          />
        </svg>

        <span className="absolute font-mono text-[18px] font-semibold text-[#e0e2ed]">
          92
        </span>
      </div>

      <div className="flex flex-col">
        <span className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
          MoneySignal Score
        </span>
        <span className="text-[18px] font-semibold text-[#4edea3]">
          Strong Bullish
        </span>
      </div>
    </div>
  );
}

function AISynthesisCard() {
  return (
    <section className="relative overflow-hidden rounded border border-[#6f00be]/50 bg-[#0D121F] p-4">
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-[#6f00be] to-transparent opacity-60" />

      <div className="mb-4 flex items-center justify-between border-b border-[#424754]/50 pb-3">
        <div className="flex items-center gap-2 text-[#ddb7ff]">
          <MaterialIcon name="auto_awesome" className="text-[22px]" />
          <h3 className="text-[18px] font-semibold">AI Synthesis</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#4edea3]" />
          <span className="font-mono text-[12px] uppercase tracking-wider text-[#4edea3]">
            Live Model
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="mb-2 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
            Executive Summary
          </h4>
          <p className="text-[14px] leading-relaxed text-[#e0e2ed]">
            NVIDIA maintains strong momentum driven by unprecedented data center
            demand. Supply constraints are easing, and next-generation Blackwell
            architecture announcements are expected to serve as a positive
            near-term catalyst.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
              Why It Matters
            </h4>
            <p className="text-[14px] leading-relaxed text-[#e0e2ed]">
              Institutional accumulation remains extremely high (+14% QoQ in Top
              50 funds). Option chain signals indicate aggressive short-dated
              call buying, suggesting anticipation of near-term catalyst. Supply
              chain data correlates with an upside surprise in data center
              revenue.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h4 className="mb-2 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
                Watch Next
              </h4>

              <ul className="flex flex-col gap-2">
                <li className="flex items-start gap-2 text-[14px] text-[#e0e2ed]">
                  <MaterialIcon
                    name="event"
                    className="mt-0.5 text-[16px] text-[#adc6ff]"
                  />
                  GTC Conference Keynote (Mar 18)
                </li>

                <li className="flex items-start gap-2 text-[14px] text-[#e0e2ed]">
                  <MaterialIcon
                    name="receipt_long"
                    className="mt-0.5 text-[16px] text-[#adc6ff]"
                  />
                  TSMC Monthly Revenue Report
                </li>
              </ul>
            </div>

            <div className="rounded border border-[#ffb4ab]/20 bg-[#93000a]/10 p-3">
              <h4 className="mb-1 flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-[#ffb4ab]">
                <MaterialIcon name="warning" className="text-[14px]" />
                Limitations / Risks
              </h4>

              <p className="text-xs leading-relaxed text-[#c2c6d6]">
                Model confidence slightly reduced due to historical high
                volatility around current valuation multiples. Regulatory export
                restrictions present asymmetric downside risk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FactorBreakdownCard() {
  return (
    <section className="rounded border border-[#424754] bg-[#0D121F] p-4">
      <div className="mb-6 flex items-center gap-2 border-b border-[#424754]/50 pb-3">
        <MaterialIcon name="assessment" className="text-[22px] text-[#adc6ff]" />
        <h3 className="text-[18px] font-semibold text-[#e0e2ed]">
          Factor Breakdown
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        {factors.map((factor) => (
          <div key={factor.label} className="flex flex-col gap-2">
            <div className="flex items-end justify-between">
              <span className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
                {factor.label}
              </span>
              <span className={`font-mono text-[14px] ${factor.textColor}`}>
                {factor.value}/100
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#31353d]">
              <div
                className={`h-full rounded-full ${factor.color}`}
                style={{ width: `${factor.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SignalTimelineCard() {
  return (
    <section className="flex h-full flex-col rounded border border-[#424754] bg-[#0D121F] p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-[#424754]/50 pb-3">
        <MaterialIcon name="timeline" className="text-[22px] text-[#c2c6d6]" />
        <h3 className="text-[18px] font-semibold text-[#e0e2ed]">
          Signal Timeline
        </h3>
      </div>

      <div className="relative flex-1">
        <div className="absolute bottom-2 left-[7px] top-2 z-0 w-px bg-[#424754]/50" />

        <div className="relative z-10 flex flex-col gap-6">
          {timeline.map((item) => (
            <div key={item.label} className="flex gap-4">
              <div
                className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 bg-[#10131b] ${item.color}`}
              />

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${item.badge}`}
                  >
                    {item.label}
                  </span>
                  <span className="font-mono text-[10px] text-[#c2c6d6]">
                    {item.time}
                  </span>
                </div>

                <p className="text-[14px] leading-relaxed text-[#e0e2ed]">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FundMovementCard() {
  return (
    <section className="flex flex-col overflow-hidden rounded border border-[#424754] bg-[#0D121F]">
      <div className="flex items-center justify-between border-b border-[#424754] bg-[#181c23] p-4">
        <div className="flex items-center gap-2">
          <MaterialIcon
            name="account_balance"
            className="text-[22px] text-[#adc6ff]"
          />
          <h3 className="text-[18px] font-semibold text-[#e0e2ed]">
            Q4 Fund Movement (13F)
          </h3>
        </div>

        <button className="flex items-center gap-1 font-mono text-[12px] uppercase text-[#c2c6d6] transition-colors hover:text-[#adc6ff]">
          View All
          <MaterialIcon name="arrow_forward" className="text-[14px]" />
        </button>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#424754] bg-[#31353d]/50">
            <th className="p-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
              Institution
            </th>
            <th className="p-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
              Action
            </th>
            <th className="p-3 text-right font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
              Shares Change
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#424754]/30 text-[14px]">
          {fundMovement.map((row) => (
            <tr key={row.institution} className="transition-colors hover:bg-[#262a32]">
              <td className="p-3 font-medium text-[#e0e2ed]">
                {row.institution}
              </td>

              <td className="p-3">
                <Badge tone={row.tone as "green" | "blue" | "red"}>
                  {row.action}
                </Badge>
              </td>

              <td
                className={`p-3 text-right font-mono ${
                  row.tone === "red" ? "text-[#ffb4ab]" : row.tone === "blue" ? "text-[#adc6ff]" : "text-[#4edea3]"
                }`}
              >
                {row.change}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function InsiderTradesCard() {
  return (
    <section className="flex flex-col overflow-hidden rounded border border-[#424754] bg-[#0D121F]">
      <div className="flex items-center justify-between border-b border-[#424754] bg-[#181c23] p-4">
        <div className="flex items-center gap-2">
          <MaterialIcon
            name="person_search"
            className="text-[22px] text-[#ddb7ff]"
          />
          <h3 className="text-[18px] font-semibold text-[#e0e2ed]">
            Insider Trades (Form 4)
          </h3>
        </div>

        <button className="flex items-center gap-1 font-mono text-[12px] uppercase text-[#c2c6d6] transition-colors hover:text-[#ddb7ff]">
          View All
          <MaterialIcon name="arrow_forward" className="text-[14px]" />
        </button>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#424754] bg-[#31353d]/50">
            <th className="p-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
              Insider
            </th>
            <th className="p-3 font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
              Type
            </th>
            <th className="p-3 text-right font-mono text-[11px] font-normal uppercase tracking-wider text-[#c2c6d6]">
              Value
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#424754]/30 text-[14px]">
          {insiderTrades.map((row) => (
            <tr key={row.insider} className="transition-colors hover:bg-[#262a32]">
              <td className="p-3 font-medium text-[#e0e2ed]">{row.insider}</td>

              <td className="p-3">
                <Badge tone={row.tone as "neutral" | "blue"}>{row.type}</Badge>
              </td>

              <td
                className={`p-3 text-right font-mono ${
                  row.tone === "blue" ? "text-[#adc6ff]" : "text-[#e0e2ed]"
                }`}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function StockDetailPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const normalizedTicker = decodeURIComponent(ticker || "NVDA").toUpperCase();

  return (
    <AppShell activePage="Stocks">
      <section className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded border border-[#4d8eff]/30 bg-[#4d8eff]/20 px-3 py-1 font-mono text-[18px] text-[#adc6ff]">
              {normalizedTicker}
            </span>

            <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#e0e2ed]">
              NVIDIA Corporation
            </h1>

            <span className="hidden rounded border border-[#424754] bg-[#262a32] px-2 py-0.5 font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6] sm:inline-block">
              Technology / Semiconductors
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#e0e2ed]">
              $875.28
            </span>

            <span className="flex items-center font-mono text-[14px] text-[#4edea3]">
              <MaterialIcon name="arrow_upward" className="text-[16px]" />
              +24.15 (2.84%)
            </span>
          </div>
        </div>

        <div className="mt-4 flex w-full items-center gap-4 md:mt-0 md:w-auto">
          <button className="flex items-center justify-center gap-2 rounded border border-[#424754] bg-[#0D121F] px-4 py-2 text-[14px] text-[#e0e2ed] transition-colors hover:bg-[#262a32]">
            <MaterialIcon name="bookmark_add" className="text-[18px]" />
            Add to Watchlist
          </button>

          <ScoreRing />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <AISynthesisCard />
          <FactorBreakdownCard />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FundMovementCard />
            <InsiderTradesCard />
          </div>
        </div>

        <div className="lg:col-span-4">
          <SignalTimelineCard />
        </div>
      </section>
    </AppShell>
  );
}