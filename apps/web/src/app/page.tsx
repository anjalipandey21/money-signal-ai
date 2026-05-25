const signalRows = [
  {
    ticker: 'NVDA',
    company: 'NVIDIA Corp',
    type: 'Institutional Accumulation',
    score: 88,
    source: '13F / SEC',
    explanation: 'Heavy 13F inflows from top-tier tech funds combined with director buying.',
    confidence: '94%',
    status: 'STRONG BULLISH',
    tone: 'green',
  },
  {
    ticker: 'PLTR',
    company: 'Palantir Tech',
    type: 'Insider Hold',
    score: 62,
    source: 'Form 4',
    explanation: 'Zero executive selling following quarterly earnings for the first time since IPO.',
    confidence: '81%',
    status: 'BULLISH',
    tone: 'blue',
  },
  {
    ticker: 'SNOW',
    company: 'Snowflake Inc',
    type: 'Cluster Buying',
    score: 92,
    source: 'Form 4 / Cluster',
    explanation: 'Three C-suite executives purchased shares on open market within a 48-hour window.',
    confidence: '98%',
    status: 'STRONG BULLISH',
    tone: 'green',
  },
  {
    ticker: 'TSLA',
    company: 'Tesla Inc',
    type: 'Conflicting Signal',
    score: 31,
    source: '13F + Form 4',
    explanation: 'Insider purchases are being offset by a major institutional exit.',
    confidence: '72%',
    status: 'CAUTION',
    tone: 'red',
  },
];

const problemCards = [
  {
    icon: '▣',
    title: 'Filings are fragmented',
    text: 'Public disclosure data is spread across SEC filings, Form 4s, 13Fs, and ownership updates, making cross-referencing slow for manual researchers.',
    tone: 'blue',
  },
  {
    icon: '↗',
    title: 'Raw data lacks context',
    text: 'A single insider purchase means little without seniority, historical accuracy, transaction size, and institutional ownership trend.',
    tone: 'green',
  },
  {
    icon: '◷',
    title: 'Research takes too long',
    text: 'By the time scattered filings are manually synthesized, the signal may already be stale. Research needs to move closer to real time.',
    tone: 'purple',
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Logo() {
  return (
    <div className="flex items-center gap-2 font-bold tracking-tight text-slate-100">
      <span className="grid h-7 w-7 place-items-center rounded-md border border-blue-300/30 bg-blue-300/10 text-blue-200">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="m7 15 4-4 3 3 5-7" />
        </svg>
      </span>
      MoneySignal AI
    </div>
  );
}

function IconBadge({ icon, tone = 'blue' }: { icon: string; tone?: string }) {
  const tones: Record<string, string> = {
    blue: 'border-blue-300/20 bg-blue-300/10 text-blue-200',
    green: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-300',
    purple: 'border-purple-300/20 bg-purple-300/10 text-purple-200',
    red: 'border-red-300/20 bg-red-300/10 text-red-300',
  };

  return (
    <div className={cx('grid h-12 w-12 place-items-center rounded-xl border text-lg', tones[tone])}>
      {icon}
    </div>
  );
}

function Gauge({
  score,
  size = 'large',
  color = 'blue',
}: {
  score: number;
  size?: 'small' | 'large';
  color?: 'blue' | 'purple';
}) {
  const isLarge = size === 'large';
  const radius = isLarge ? 145 : 64;
  const center = isLarge ? 160 : 72;
  const stroke = isLarge ? 16 : 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const svgSize = isLarge ? 320 : 144;

  return (
    <div className={cx('relative', isLarge ? 'h-80 w-80' : 'h-36 w-36')}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="rgba(51,65,85,.65)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={color === 'purple' ? '#ddb7ff' : '#adc6ff'}
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cx('font-bold tracking-tight text-slate-100', isLarge ? 'text-8xl' : 'text-3xl')}>
          {score}
        </span>
        {isLarge && (
          <span className="mt-2 font-mono text-sm uppercase tracking-[0.3em] text-slate-500">
            MoneyScore
          </span>
        )}
      </div>
    </div>
  );
}

function HeroTerminal() {
  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="absolute -inset-10 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="glass relative overflow-hidden rounded-2xl p-1.5 shadow-[0_48px_96px_-24px_rgba(0,0,0,.75)]">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#05070a]">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-300/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-purple-300/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-300/40" />
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
                Terminal v4.2 // NVDA
              </span>
            </div>

            <div className="hidden min-w-[260px] items-center gap-3 rounded-lg border border-slate-800 bg-slate-700/20 px-4 py-1.5 md:flex">
              <span className="text-slate-500">⌕</span>
              <span className="font-mono text-[11px] text-slate-500">
                Search tickers, signals, or entities...
              </span>
            </div>
          </div>

          <div className="grid gap-1.5 p-1.5 lg:grid-cols-12">
            <div className="space-y-1.5 lg:col-span-8">
              <div className="grid gap-1.5 md:grid-cols-2">
                <div className="relative flex items-center gap-8 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-left">
                  <span className="absolute right-4 top-4 rounded border border-emerald-300/30 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
                    SYNCED
                  </span>

                  <Gauge score={92} size="small" />

                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase text-slate-500">
                      Signal Status
                    </p>
                    <h3 className="mb-1 text-2xl font-bold text-emerald-300">
                      Strong Accumulation
                    </h3>
                    <p className="text-sm text-slate-400">
                      ↟ High conviction institutional flow
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-left">
                  <p className="mb-4 font-mono text-[10px] uppercase text-slate-500">
                    Insider Activity 30D
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Net Volume</span>
                      <span className="font-mono text-emerald-300">+$14.2M</span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[85%] rounded-full bg-emerald-300" />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Director Conviction</span>
                      <span className="font-mono text-blue-200">High</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative h-72 rounded-lg border border-slate-800 bg-slate-900/40 p-8">
                <p className="mb-6 text-left font-mono text-[10px] uppercase text-slate-500">
                  Institutional Flow Analysis
                </p>

                <svg className="mt-4 h-44 w-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                  <defs>
                    <linearGradient id="hero-chart-grad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#adc6ff" stopOpacity="0.14" />
                      <stop offset="100%" stopColor="#adc6ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path
                    className="chart-line"
                    d="M0,15 Q10,12 20,16 T40,10 T60,14 T80,8 T100,12"
                    fill="none"
                    stroke="#adc6ff"
                    strokeWidth="0.75"
                  />
                  <path
                    className="chart-line"
                    d="M0,18 Q15,15 30,17 T50,12 T75,15 T100,10"
                    fill="none"
                    stroke="#4edea3"
                    strokeOpacity="0.45"
                    strokeWidth="0.5"
                  />
                  <path
                    d="M0,15 Q10,12 20,16 T40,10 T60,14 T80,8 T100,12 L100,20 L0,20 Z"
                    fill="url(#hero-chart-grad)"
                  />
                </svg>

                <div className="absolute bottom-6 left-8 right-8 flex justify-between font-mono text-[9px] uppercase text-slate-500">
                  <span>Oct 2023</span>
                  <span>Jan 2024</span>
                  <span>Apr 2024</span>
                </div>
              </div>
            </div>

            <div className="glow-purple flex min-h-[460px] flex-col rounded-lg bg-purple-950/10 p-6 lg:col-span-4">
              <div className="mb-6 flex items-center gap-2">
                <span className="text-xl text-purple-200">✦</span>
                <p className="font-mono text-[10px] uppercase tracking-widest text-purple-200">
                  AI Synthesis
                </p>
              </div>

              <div className="space-y-6 text-left">
                <div className="rounded-r border-l-2 border-purple-200 bg-purple-500/10 p-4">
                  <p className="text-xs leading-relaxed text-slate-200">
                    <span className="font-bold uppercase text-purple-200">
                      Executive Summary:
                    </span>{' '}
                    Institutional heavyweights are layering into the current consolidation.
                    Three key directors have halted selling for the first time in 24 months.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="border-b border-slate-800 pb-1 font-mono text-[9px] uppercase text-slate-500">
                    Live Signal Feed
                  </p>

                  {[
                    '13F: BlackRock increased position by 4.2%',
                    'Form 4: CEO open-market purchase $2.1M',
                    '13G: New 5% owner disclosure',
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-3">
                      <div
                        className={cx(
                          'mt-1.5 h-1.5 w-1.5 rounded-full',
                          index === 1 ? 'bg-emerald-300' : 'bg-blue-300'
                        )}
                      />
                      <div>
                        <p className="text-[11px] text-slate-200">{item}</p>
                        <p className="mt-0.5 text-[9px] text-slate-500">
                          {index === 0 ? '2 mins ago' : index === 1 ? '14 mins ago' : '1 hr ago'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: string; children: string }) {
  const classes: Record<string, string> = {
    green: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-300',
    blue: 'border-blue-300/20 bg-blue-300/10 text-blue-200',
    red: 'border-red-300/20 bg-red-300/10 text-red-300',
  };

  return (
    <span className={cx('rounded border px-3 py-1 text-[10px] font-bold', classes[tone])}>
      {children}
    </span>
  );
}

const bentoCards = [
  {
    title: 'Insider Trades',
    text: 'Real-time open-market purchase and sale tracking with seniority weighting.',
    icon: '♟',
    className: 'md:col-span-4',
    tone: 'green',
    content: (
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 font-mono text-[10px]">
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span>CEO PURCHASE</span>
          <span className="font-bold text-emerald-300">+$1.2M</span>
        </div>
        <div className="mt-2 flex justify-between text-slate-500">
          <span>CFO OPTION EXC.</span>
          <span>12k Shrs</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Institutional Movement',
    text: 'Map 13F and 13G filings to identify high-conviction fund positioning before the crowd notices.',
    icon: '⌂',
    className: 'md:col-span-8 md:flex-row',
    tone: 'blue',
    content: (
      <div className="relative flex min-h-[160px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-[#05070a] p-6">
        <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6">
          <div className="h-3 w-full rounded-full bg-blue-300/20" />
          <div className="h-3 w-[85%] rounded-full bg-blue-300/15" />
          <div className="h-3 w-[70%] rounded-full bg-blue-300/10" />
          <div className="h-3 w-[60%] rounded-full bg-blue-300/5" />
        </div>
        <span className="relative z-10 rounded border border-blue-300/30 bg-blue-300/10 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-blue-200">
          Clustering Algorithm Live
        </span>
      </div>
    ),
  },
  {
    title: 'MoneySignal Score',
    text: 'A normalized 1–100 score weighting signal strength, freshness, seniority, and institutional support.',
    icon: '◎',
    className: 'md:col-span-7 md:flex-row-reverse',
    tone: 'purple',
    content: (
      <div className="flex flex-1 items-center justify-center">
        <Gauge score={87} size="small" color="purple" />
      </div>
    ),
  },
  {
    title: 'AI Explanations',
    text: 'Natural-language synthesis that turns complex filings into readable research context.',
    icon: '✦',
    className: 'md:col-span-5 glow-purple',
    tone: 'purple',
    content: (
      <div className="rounded-lg border border-purple-300/20 bg-purple-500/10 p-3 text-[10px] italic text-purple-200">
        “Analyzing 42 recent filings for NVDA. High director stasis detected.”
      </div>
    ),
  },
  {
    title: 'Watchlist Alerts',
    text: 'Get notified when high-conviction signals are detected for your tracked companies.',
    icon: '◇',
    className: 'md:col-span-4',
    tone: 'blue',
    content: (
      <div className="flex flex-wrap gap-2">
        {['SMS', 'DISCORD', 'API'].map((item) => (
          <span
            key={item}
            className="rounded border border-blue-300/20 bg-blue-300/10 px-3 py-1 font-mono text-[10px] text-blue-200"
          >
            {item}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: 'Conflicting Signals',
    text: 'Detect divergence when insiders buy but institutions sell, helping identify potential traps.',
    icon: '△',
    className: 'md:col-span-8 md:flex-row',
    tone: 'red',
    content: (
      <div className="grid min-h-[140px] flex-1 grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/5">
          <span className="text-lg font-bold text-emerald-300">BUY</span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-slate-500">
            Insider
          </span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-300/20 bg-red-300/5">
          <span className="text-lg font-bold text-red-300">SELL</span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-slate-500">
            Institutional
          </span>
        </div>
      </div>
    ),
  },
];

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-[#0a0e16] text-slate-100 antialiased selection:bg-blue-200 selection:text-blue-950">
        <header className="fixed top-0 z-50 w-full border-b border-slate-800 bg-[#0a0e16]/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-8">
              <Logo />

              <nav className="hidden gap-8 md:flex">
                {['Platform', 'Intelligence', 'Institutional', 'Pricing'].map((item, index) => (
                  <a
                    key={item}
                    href="#"
                    className={cx(
                      'text-sm font-medium transition-colors hover:text-blue-200',
                      index === 0 ? 'text-blue-200' : 'text-slate-400'
                    )}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-slate-100 sm:block">
                Login
              </button>
              <button className="rounded-lg bg-blue-200 px-5 py-2 text-sm font-bold text-blue-950 transition hover:brightness-110 active:scale-95">
                Get Started
              </button>
            </div>
          </div>
        </header>

        <main className="page-bg pt-32">
          <section className="mx-auto mb-40 max-w-[1440px] px-4 text-center md:px-8">
            <div className="mb-20 flex flex-col items-center gap-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  Live Alpha • Smart Disclosure Intelligence
                </span>
              </div>

              <h1 className="max-w-5xl text-5xl font-bold leading-[1.05] tracking-tight text-slate-100 md:text-7xl lg:text-8xl">
                See where{' '}
                <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  smart money
                </span>{' '}
                is moving.
              </h1>

              <p className="max-w-3xl text-lg leading-relaxed text-slate-400 md:text-xl">
                MoneySignal AI turns public filings, insider activity, institutional holdings, and
                market-moving disclosures into unified signals, scores, and AI explanations.
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-4">
                <button className="rounded-xl bg-blue-200 px-8 py-4 font-bold text-blue-950 transition hover:shadow-[0_0_40px_rgba(173,198,255,.35)]">
                  Get Early Access ↗
                </button>
                <button className="rounded-xl border border-slate-800 px-8 py-4 font-bold text-slate-100 transition hover:bg-slate-900">
                  View Demo Dashboard
                </button>
              </div>
            </div>

            <HeroTerminal />
          </section>

          <section className="bg-[#0a0e16]/60 py-36">
            <div className="mx-auto max-w-[1440px] px-4 md:px-8">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-4xl font-bold tracking-tight">
                  Public signals are scattered.
                </h2>
                <p className="mx-auto max-w-2xl text-slate-400">
                  Market disclosures contain valuable research signals, but they are difficult to
                  parse and connect at scale.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {problemCards.map((card) => (
                  <div key={card.title} className="glass premium-hover rounded-2xl p-8">
                    <IconBadge icon={card.icon} tone={card.tone} />
                    <h3 className="mt-6 text-lg font-semibold">{card.title}</h3>
                    <p className="mt-3 leading-relaxed text-slate-400">{card.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-slate-800 bg-[#05070a] py-36">
            <div className="mx-auto max-w-[1440px] px-4 md:px-8">
              <div className="mb-20 text-center">
                <h2 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl">
                  One Intelligence Layer for Smart-Money Signals.
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-slate-400">
                  Unified intelligence across insider trades, institutional movement, signal
                  scoring, and AI research context.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                {bentoCards.map((card) => (
                  <div
                    key={card.title}
                    className={cx(
                      'glass premium-hover flex flex-col justify-between gap-8 rounded-2xl p-8',
                      card.className
                    )}
                  >
                    <div className="flex-1">
                      <IconBadge icon={card.icon} tone={card.tone} />
                      <h3 className="mt-6 text-lg font-semibold">{card.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.text}</p>
                    </div>
                    {card.content}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[#0a0e16] py-36">
            <div className="mx-auto max-w-[1440px] px-4 md:px-8">
              <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <h2 className="mb-3 text-4xl font-bold tracking-tight">
                    From disclosure to signal in seconds.
                  </h2>
                  <p className="text-lg text-slate-400">
                    Real-time terminal feed of high-conviction smart-money signals.
                  </p>
                </div>
                <button className="w-fit font-bold text-blue-200 hover:underline">
                  Explore Full Terminal →
                </button>
              </div>

              <div className="glass overflow-hidden rounded-2xl shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-collapse text-left font-mono text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/70">
                        {[
                          'Ticker',
                          'Signal Type',
                          'Score',
                          'Source',
                          'AI Explanation',
                          'Confidence',
                          'Status',
                        ].map((head) => (
                          <th
                            key={head}
                            className={cx(
                              'p-5 text-[10px] uppercase tracking-widest text-slate-500',
                              head === 'Status' && 'text-right',
                              head === 'Score' && 'text-center',
                              head === 'Confidence' && 'text-center'
                            )}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {signalRows.map((row) => (
                        <tr
                          key={row.ticker}
                          className="cursor-pointer border-b border-slate-800/50 transition hover:bg-blue-300/[.04]"
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <span className="rounded bg-slate-700/50 px-2 py-1 font-bold text-slate-100">
                                {row.ticker}
                              </span>
                              <span className="text-[11px] text-slate-500">{row.company}</span>
                            </div>
                          </td>

                          <td className="p-5 text-slate-200">{row.type}</td>

                          <td
                            className={cx(
                              'p-5 text-center font-bold',
                              row.tone === 'green'
                                ? 'text-emerald-300'
                                : row.tone === 'red'
                                  ? 'text-red-300'
                                  : 'text-blue-200'
                            )}
                          >
                            {row.score}
                          </td>

                          <td className="p-5 text-xs text-slate-500">{row.source}</td>
                          <td className="max-w-xs truncate p-5 text-slate-400">
                            {row.explanation}
                          </td>
                          <td className="p-5 text-center text-slate-200">{row.confidence}</td>
                          <td className="p-5 text-right">
                            <StatusPill tone={row.tone}>{row.status}</StatusPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-slate-800 bg-[#05070a]/30 py-36">
            <div className="mx-auto grid max-w-[1440px] items-center gap-16 px-4 md:px-8 lg:grid-cols-2">
              <div>
                <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
                  The MoneySignal Score.
                </h2>

                <p className="text-xl leading-relaxed text-slate-400">
                  A proprietary normalization engine that prioritizes disclosures by signal
                  strength, filing freshness, institutional support, and insider alignment.
                </p>

                <div className="mt-10 space-y-8">
                  {[
                    ['Signal Strength', '92/100', 'w-[92%]', 'bg-emerald-300', 'text-emerald-300'],
                    ['Filing Freshness', '88/100', 'w-[88%]', 'bg-blue-200', 'text-blue-200'],
                    ['Institutional Support', '75/100', 'w-[75%]', 'bg-purple-200', 'text-purple-200'],
                    ['Insider Alignment', '95/100', 'w-[95%]', 'bg-emerald-300', 'text-emerald-300'],
                  ].map(([label, value, width, bar, text]) => (
                    <div key={label}>
                      <div className="mb-2 flex justify-between font-mono text-[11px] uppercase tracking-widest">
                        <span className="text-slate-500">{label}</span>
                        <span className={text}>{value}</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full border border-slate-800 bg-slate-900">
                        <div className={cx('h-full rounded-full', width, bar)} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    <span className="mb-1 block font-bold uppercase tracking-tight text-slate-200">
                      Research Disclaimer
                    </span>
                    The score helps prioritize disclosures for further research. It does not provide
                    investment recommendations or financial advice.
                  </p>
                </div>
              </div>

              <div className="glass relative flex flex-col items-center justify-center overflow-hidden rounded-[40px] p-10 text-center md:p-20">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-[100px]" />
                <div className="relative z-10">
                  <Gauge score={87} />

                  <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-6 py-3 text-sm font-bold tracking-widest text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    STRONG SMART-MONEY SIGNAL
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-36">
            <div className="mx-auto grid max-w-[1440px] gap-12 px-4 md:px-8 lg:grid-cols-12 lg:gap-16">
              <div className="flex flex-col justify-center lg:col-span-4">
                <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
                  AI Context Layer.
                </h2>

                <p className="text-xl leading-relaxed text-slate-400">
                  We do not just show data. We explain why it matters by combining history,
                  context, and seniority into plain English.
                </p>

                <div className="mt-10 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-10 w-10 rounded-full border-2 border-[#0a0e16] bg-slate-800"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-slate-400">
                    Built for research-focused investors
                  </span>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="glow-purple relative overflow-hidden rounded-[32px] bg-purple-950/10 p-8 md:p-12">
                  <div className="mb-10 flex items-center gap-4">
                    <span className="text-3xl text-purple-200">✦</span>
                    <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-purple-200">
                      AI Synthesis // NVDA
                    </h3>
                  </div>

                  <span className="absolute right-8 top-8 hidden rounded-full border border-purple-300/30 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-purple-200 md:block">
                    Research Module v2.0
                  </span>

                  <div className="grid gap-10 md:grid-cols-2">
                    <div className="space-y-10">
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase text-purple-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-200" />
                          Executive Summary
                        </h4>
                        <p className="text-lg leading-relaxed text-slate-100">
                          Institutional heavyweights are layering into the current consolidation.
                          Three key directors have halted selling for the first time in 24 months.
                        </p>
                      </div>

                      <div>
                        <h4 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase text-purple-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-200" />
                          Why It Matters
                        </h4>
                        <p className="leading-relaxed text-slate-200">
                          Historically, this type of alignment between director stasis and
                          institutional inflows can indicate stronger conviction than isolated filing
                          events.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="premium-hover rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                        <h4 className="mb-3 font-mono text-[10px] uppercase text-emerald-300">
                          👁 Watch Next
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-400">
                          Monitor upcoming Form 4s for CFO participation. A purchase here would
                          confirm a stronger accumulation cluster.
                        </p>
                      </div>

                      <div className="premium-hover rounded-2xl border border-red-300/20 bg-red-300/5 p-6">
                        <h4 className="mb-3 font-mono text-[10px] uppercase text-red-300">
                          ⚠ Limitations / Risks
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-400">
                          Sector rotation and broader market conditions may offset company-specific
                          accumulation signals in the short term.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden border-t border-slate-800 bg-[#0a0e16] px-4 py-36 text-center md:px-8">
            <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-[150px]" />

            <div className="relative z-10 mx-auto max-w-4xl">
              <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                Start researching <span className="text-blue-200">smart-money signals</span>.
              </h2>

              <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-slate-400">
                Explore insider trades, institutional movement, and AI-explained public disclosures
                from one unified research dashboard.
              </p>

              <div className="flex flex-wrap justify-center gap-5">
                <button className="rounded-xl bg-blue-200 px-10 py-5 text-lg font-bold text-blue-950 transition hover:shadow-[0_0_50px_rgba(173,198,255,.35)]">
                  Get Early Access 🚀
                </button>
                <button className="rounded-xl border border-slate-800 px-10 py-5 text-lg font-bold text-slate-100 transition hover:bg-slate-900">
                  View Demo Dashboard
                </button>
              </div>

              <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
                Research Intelligence Only • No Advice Given
              </p>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-800 bg-[#0a0e16] py-20">
          <div className="mx-auto max-w-[1440px] px-4 md:px-8">
            <div className="grid gap-12 md:grid-cols-12">
              <div className="md:col-span-5">
                <Logo />
                <p className="mt-6 max-w-md leading-relaxed text-slate-400">
                  MoneySignal AI provides intelligence by analyzing public market money movement and
                  smart-money signals. We deliver context, not financial advice.
                </p>
              </div>

              <div className="grid gap-10 sm:grid-cols-3 md:col-span-7">
                {[
                  ['Platform', 'Intelligence Feed', 'Insider Tracker', 'Institutional Maps'],
                  ['Resources', 'SEC Filing Guide', 'API Documentation', 'Research Reports'],
                  ['Legal', 'Terms of Service', 'Privacy Policy', 'Contact Research'],
                ].map(([title, ...links]) => (
                  <div key={title}>
                    <h5 className="mb-5 font-mono text-[11px] uppercase tracking-widest text-slate-100">
                      {title}
                    </h5>
                    <nav className="flex flex-col gap-3">
                      {links.map((link) => (
                        <a key={link} href="#" className="text-sm text-slate-400 transition hover:text-slate-100">
                          {link}
                        </a>
                      ))}
                    </nav>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16 border-t border-slate-800 pt-8 font-mono text-[11px] uppercase tracking-wider text-slate-600">
              © 2026 MoneySignal AI. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        .page-bg {
          background-image:
            radial-gradient(circle at 50% 0%, rgba(77,142,255,.08) 0%, transparent 60%),
            linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
          background-size: 100% 100%, 32px 32px, 32px 32px;
        }

        .glass {
          background: rgba(13, 17, 23, .72);
          border: 1px solid #1e293b;
          backdrop-filter: blur(20px);
        }

        .glow-purple {
          border: 1px solid rgba(216, 180, 254, .28);
          box-shadow: 0 0 42px rgba(168, 85, 247, .14);
        }

        .premium-hover {
          transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease, background .25s ease;
        }

        .premium-hover:hover {
          transform: translateY(-2px);
          border-color: rgba(173, 198, 255, .35);
          box-shadow: 0 22px 50px -30px rgba(173, 198, 255, .28);
        }

        .chart-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2s ease-out forwards;
        }

        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}