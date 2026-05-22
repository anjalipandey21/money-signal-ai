type Feature = {
  title: string;
  description: string;
  metric: string;
};

const features: Feature[] = [
  {
    title: "Insider trade radar",
    description:
      "Track executive buying and selling patterns with context around timing, size, and repeated conviction.",
    metric: "Form 4",
  },
  {
    title: "Fund holding intelligence",
    description:
      "Follow institutional ownership changes across filings and surface notable accumulation or rotation.",
    metric: "13F",
  },
  {
    title: "Money-movement signals",
    description:
      "Connect filings, volume shifts, and unusual positioning into a cleaner view of where capital is moving.",
    metric: "AI",
  },
];

const problemPoints = [
  "Filings are fragmented across forms, dates, and sources.",
  "Important changes are easy to miss until the market has already reacted.",
  "Raw data rarely explains whether a move is routine, urgent, or worth watching.",
];

const signalRows = [
  {
    ticker: "NVDA",
    signal: "Fund accumulation",
    source: "13F cluster",
    strength: "High",
    change: "+18.4%",
  },
  {
    ticker: "CRM",
    signal: "Insider purchase",
    source: "CEO filing",
    strength: "Medium",
    change: "+4.9%",
  },
  {
    ticker: "PANW",
    signal: "Unusual flow",
    source: "Volume shift",
    strength: "High",
    change: "+11.2%",
  },
];

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-slate-600">{description}</p>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-sm font-bold text-emerald-700">
        {feature.metric}
      </div>
      <h3 className="mt-6 text-xl font-semibold text-slate-950">
        {feature.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {feature.description}
      </p>
    </article>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/80">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Signal command center
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Smart-money events ranked by urgency
          </p>
        </div>
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          Live watchlist
        </div>
      </div>

      <div className="grid gap-4 py-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Conviction score
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                87
              </p>
            </div>
            <p className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              +12 today
            </p>
          </div>
          <div className="mt-8 flex h-36 items-end gap-2">
            {[38, 56, 44, 72, 66, 88, 78, 94, 84, 100].map((height, index) => (
              <div
                className="w-full rounded-t-sm bg-emerald-500"
                key={index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {[
            ["Insider buys", "24", "+8.1%"],
            ["Fund position raises", "142", "+15.6%"],
            ["Fresh alerts", "31", "+5.4%"],
          ].map(([label, value, change]) => (
            <div
              className="rounded-lg border border-slate-100 bg-white p-4"
              key={label}
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                {label}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-2xl font-semibold text-slate-950">{value}</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[0.7fr_1.2fr_1fr_0.8fr_0.7fr] bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
            <span>Ticker</span>
            <span>Signal</span>
            <span>Source</span>
            <span>Strength</span>
            <span className="text-right">Move</span>
          </div>
          {signalRows.map((row) => (
            <div
              className="grid grid-cols-[0.7fr_1.2fr_1fr_0.8fr_0.7fr] border-t border-slate-100 px-4 py-4 text-sm"
              key={row.ticker}
            >
              <span className="font-semibold text-slate-950">{row.ticker}</span>
              <span className="text-slate-700">{row.signal}</span>
              <span className="text-slate-500">{row.source}</span>
              <span className="font-medium text-slate-700">
                {row.strength}
              </span>
              <span className="text-right font-semibold text-emerald-600">
                {row.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <a className="text-lg font-bold tracking-tight" href="#">
          MoneySignal AI
        </a>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex"
        >
          <a className="transition hover:text-slate-950" href="#problem">
            Problem
          </a>
          <a className="transition hover:text-slate-950" href="#features">
            Features
          </a>
          <a className="transition hover:text-slate-950" href="#preview">
            Preview
          </a>
        </nav>
        <a
          className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          href="#cta"
        >
          Join waitlist
        </a>
      </header>

      <section className="relative isolate overflow-hidden border-y border-slate-200 bg-white">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(15,23,42,0.95),rgba(15,23,42,0.72)),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.34),transparent_32%)]" />
        <div className="absolute inset-x-6 top-24 -z-10 mx-auto hidden max-w-6xl opacity-30 blur-[1px] lg:block">
          <DashboardPreview />
        </div>
        <div className="mx-auto flex min-h-[680px] max-w-7xl items-center px-6 py-24 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Smart-money intelligence
            </p>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              MoneySignal AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              An AI-powered fintech platform for tracking insider trades, fund
              holdings, and money-movement signals before they disappear into
              market noise.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                className="rounded-md bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-300"
                href="#cta"
              >
                Request early access
              </a>
              <a
                className="rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                href="#preview"
              >
                View platform preview
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50" id="problem">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              The problem
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Smart money leaves clues. Investors need a faster way to read
              them.
            </h2>
          </div>
          <div className="grid gap-4">
            {problemPoints.map((point, index) => (
              <div
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
                key={point}
              >
                <p className="text-sm font-semibold text-emerald-600">
                  0{index + 1}
                </p>
                <p className="mt-3 text-base leading-7 text-slate-700">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24 lg:px-8" id="features">
        <SectionHeader
          eyebrow="Platform signals"
          title="Built for investors who follow capital, not headlines."
          description="MoneySignal AI turns scattered filings and transaction data into concise intelligence, helping teams prioritize the signals that deserve attention."
        />
        <div className="mx-auto mt-14 grid max-w-7xl gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard feature={feature} key={feature.title} />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-24 lg:px-8" id="preview">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Dashboard preview
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              One workspace for filings, ownership changes, and AI-ranked
              conviction.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              The first version focuses on a clear intelligence layer: what
              moved, who moved it, why it matters, and which symbols should move
              up your research queue.
            </p>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="bg-white px-6 py-24 lg:px-8" id="cta">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Early access
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Start building your smart-money edge.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            MoneySignal AI is preparing a focused private beta for investors,
            analysts, and operators who want cleaner market intelligence.
          </p>
          <a
            className="mt-10 inline-flex rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            href="mailto:hello@moneysignal.ai?subject=MoneySignal%20AI%20early%20access"
          >
            Request beta invite
          </a>
        </div>
      </section>
    </main>
  );
}
