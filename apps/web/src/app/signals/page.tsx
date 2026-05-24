import { AppShell } from "@/components/layout/AppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ActionBadge } from "@/components/ui/ActionBadge";

const signals = [
  {
    ticker: "PLTR",
    signalEvent: "Insider Buy",
    score: 94,
    confidence: "88%",
    source: "Form 4",
    aiContext:
      "CEO Alex Karp exercised options and held 2.4M shares. First non-sale transaction in 18 months.",
    time: "2m ago",
  },
  {
    ticker: "NVDA",
    signalEvent: "Multi-Fund Buying",
    score: 82,
    confidence: "92%",
    source: "13F Comparison",
    aiContext:
      "Multiple funds increased NVDA exposure across recent filings, suggesting continued institutional accumulation.",
    time: "15m ago",
  },
  {
    ticker: "TSLA",
    signalEvent: "Position Trimmed",
    score: 65,
    confidence: "75%",
    source: "SEC 13F-HR",
    aiContext:
      "Large position reduction detected across several funds. Signal appears mixed due to continued long-term holding.",
    time: "1h ago",
  },
  {
    ticker: "SNOW",
    signalEvent: "Conflicting Signal",
    score: 21,
    confidence: "81%",
    source: "Public Disclosure",
    aiContext:
      "Retail sentiment remains high while institutional flow shows quarter-over-quarter outflows.",
    time: "3h ago",
  },
  {
    ticker: "CRWD",
    signalEvent: "Institutional Accumulation",
    score: 88,
    confidence: "95%",
    source: "SEC 13F-HR",
    aiContext:
      "Multiple 13F filings show new significant positions from top-tier funds including Renaissance and Two Sigma.",
    time: "5h ago",
  },
];

function ScoreText({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-[#4edea3]"
      : score >= 60
        ? "text-[#adc6ff]"
        : "text-[#ffb4ab]";

  return <span className={`font-mono font-semibold ${color}`}>{score}</span>;
}

export default function SignalsPage() {
  return (
    <AppShell activePage="Signals Feed">
      <section className="flex flex-col gap-2">
        <h1 className="text-[48px] font-bold leading-tight tracking-[-0.02em] text-[#e0e2ed]">
          Real-time Signals
        </h1>
        <p className="max-w-2xl text-[14px] leading-6 text-[#c2c6d6]">
          Latest public money-movement signals from tracked companies and funds.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <button className="rounded-full border border-[#424754] bg-[#181c23] px-4 py-2 font-mono text-[12px] text-[#e0e2ed]">
          All Types ▾
        </button>
        <button className="rounded-full border border-[#424754] bg-[#181c23] px-4 py-2 font-mono text-[12px] text-[#e0e2ed]">
          Score: &gt; 80 ▾
        </button>
        <button className="rounded-full border border-[#424754] bg-[#181c23] px-4 py-2 font-mono text-[12px] text-[#e0e2ed]">
          Time: 24h ▾
        </button>
        <button className="rounded-full border border-[#424754] bg-[#181c23] px-4 py-2 font-mono text-[12px] text-[#e0e2ed]">
          Source Type ▾
        </button>
      </section>

      <GlassPanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#424754]/30 font-mono text-[10px] uppercase tracking-wider text-[#c2c6d6]">
                <th className="px-4 py-4 font-medium">Ticker</th>
                <th className="px-4 py-4 font-medium">Signal Event</th>
                <th className="px-4 py-4 text-center font-medium">Score</th>
                <th className="px-4 py-4 text-center font-medium">Conf.</th>
                <th className="px-4 py-4 font-medium">Source</th>
                <th className="px-4 py-4 font-medium">AI Context</th>
                <th className="px-4 py-4 text-right font-medium">Time</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#424754]/20 text-[14px] text-[#e0e2ed]">
              {signals.map((signal) => (
                <tr
                  key={`${signal.ticker}-${signal.signalEvent}`}
                  className="transition hover:bg-[#262a32]/50"
                >
                  <td className="px-4 py-5 font-mono font-semibold text-[#e0e2ed]">
                    {signal.ticker}
                  </td>

                  <td className="px-4 py-5">
                    <ActionBadge action={signal.signalEvent} />
                  </td>

                  <td className="px-4 py-5 text-center">
                    <ScoreText score={signal.score} />
                  </td>

                  <td className="px-4 py-5 text-center font-mono text-[#c2c6d6]">
                    {signal.confidence}
                  </td>

                  <td className="px-4 py-5 font-mono text-[12px] text-[#c2c6d6]">
                    {signal.source}
                  </td>

                  <td className="max-w-[520px] px-4 py-5 leading-6 text-[#c2c6d6]">
                    {signal.aiContext}
                  </td>

                  <td className="px-4 py-5 text-right font-mono text-[12px] text-[#c2c6d6]">
                    {signal.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#424754]/30 px-4 py-4">
          <p className="text-[12px] text-[#c2c6d6]">
            Showing latest tracked public-disclosure signals
          </p>

          <div className="flex gap-2">
            <button className="rounded-[2px] border border-[#424754] bg-[#181c23] px-4 py-2 text-[12px] text-[#8c909f]">
              Prev
            </button>
            <button className="rounded-[2px] border border-[#424754] bg-[#181c23] px-4 py-2 text-[12px] text-[#e0e2ed]">
              Next
            </button>
          </div>
        </div>
      </GlassPanel>
    </AppShell>
  );
}