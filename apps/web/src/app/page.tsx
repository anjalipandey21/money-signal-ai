import Link from "next/link";

const features = [
  {
    title: "MoneySignal Score",
    description:
      "A simple 0–100 score that summarizes signal strength, source quality, freshness, and confidence.",
    accent: "text-blue-300",
  },
  {
    title: "Institutional Movement",
    description:
      "Track fund accumulation, new positions, trims, and multi-fund buying patterns from public disclosures.",
    accent: "text-emerald-300",
  },
  {
    title: "AI Explanations",
    description:
      "Convert complex filings and money-movement signals into plain-English research summaries.",
    accent: "text-violet-300",
  },
];

const pipelineSteps = [
  {
    step: "01",
    title: "Ingest",
    description: "Collect public financial disclosures and market signal data.",
  },
  {
    step: "02",
    title: "Normalize",
    description: "Clean and structure filings into stocks, funds, insiders, and signals.",
  },
  {
    step: "03",
    title: "Detect & Score",
    description: "Classify signal type and calculate the MoneySignal Score.",
  },
  {
    step: "04",
    title: "Explain",
    description: "Use AI to explain why the signal matters and what to watch next.",
  },
];

const previewSignals = [
  {
    ticker: "NVDA",
    signal: "Multi-Fund Buying",
    score: 92,
    source: "13F Comparison",
  },
  {
    ticker: "GOOGL",
    signal: "New Fund Position",
    score: 89,
    source: "SEC 13F-HR",
  },
  {
    ticker: "PLTR",
    signal: "Insider Open-Market Buy",
    score: 79,
    source: "Form 4",
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/15 shadow-lg shadow-blue-500/10">
        <span className="text-lg font-black text-blue-300">M</span>
      </div>

      <div>
        <p className="text-sm font-semibold tracking-wide text-white">
          MoneySignal AI
        </p>
        <p className="text-xs text-slate-400">Institutional Grade</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#080D18] text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-[#080D18]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Logo />

          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How It Works
            </a>
            <Link href="/login" className="transition hover:text-white">
              Log In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
            >
              Get Early Access
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-20 top-40 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Public-disclosure intelligence for modern investors
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
              See where smart money is moving.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              MoneySignal AI turns public financial disclosures into simple,
              scored, AI-explained research intelligence.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="rounded-xl bg-blue-500 px-6 py-3 text-center font-semibold text-white shadow-xl shadow-blue-500/20 transition hover:bg-blue-400"
              >
                Start Researching
              </Link>

              <a
                href="#demo"
                className="rounded-xl border border-slate-700 bg-slate-900/70 px-6 py-3 text-center font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Watch Demo
              </a>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Research only. Not investment advice.
            </p>
          </div>

          {/* Product Preview */}
          <div id="demo" className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl shadow-black/40">
            <div className="rounded-2xl border border-slate-800 bg-[#0B1020] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Dashboard Preview
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Top MoneySignal Scores
                  </h2>
                </div>

                <div className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs text-blue-300">
                  Live Alpha
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {previewSignals.map((item) => (
                  <div
                    key={item.ticker}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-semibold">
                        {item.ticker}
                      </span>
                      <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-bold text-slate-950">
                        {item.score}
                      </span>
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-200">
                      {item.signal}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Source: {item.source}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-300" />
                  <p className="text-sm font-semibold text-violet-200">
                    AI Market Pulse
                  </p>
                </div>

                <p className="text-sm leading-6 text-slate-300">
                  Institutional activity shows continued accumulation in
                  large-cap technology, while high-volatility growth names show
                  mixed positioning across recent disclosures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            Signal over noise
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for faster financial research.
          </h2>
          <p className="mt-4 text-slate-400">
            Instead of reading scattered filings manually, users get one clean
            intelligence layer for public money-movement signals.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/10"
            >
              <div className={`mb-4 text-sm font-semibold ${feature.accent}`}>
                {feature.title}
              </div>
              <p className="text-sm leading-7 text-slate-300">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section
        id="how-it-works"
        className="border-y border-slate-800 bg-slate-950/50"
      >
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              From public disclosures to explainable signals.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            {pipelineSteps.map((item) => (
              <article
                key={item.step}
                className="rounded-2xl border border-slate-800 bg-[#0B1020] p-6"
              >
                <p className="font-mono text-sm text-blue-300">{item.step}</p>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>© 2026 MoneySignal AI. Research intelligence platform.</p>

        <p>
          Research only. Not investment advice. Verify all signals against
          primary public filings.
        </p>
      </footer>
    </main>
  );
}