type DashboardSignal = {
  id: number;
  ticker: string;
  company_name: string;
  sector: string;
  signal_type: string;
  source_type: string;
  source_name: string;
  signal_strength: string;
  money_signal_score: number;
  explanation: string;
  created_at: string;
};

async function getDashboardSignals(): Promise<DashboardSignal[]> {
  const response = await fetch("http://localhost:8001/api/dashboard/signals", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard signals");
  }

  return response.json();
}

export default async function DashboardPage() {
  const signals = await getDashboardSignals();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 border-b border-slate-800 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
              MoneySignal AI
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Smart-Money Dashboard
            </h1>

            <p className="mt-4 max-w-2xl text-slate-300">
              Track insider trades, institutional fund movement, and high-signal
              market activity in one place.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
            <p className="text-sm text-emerald-300">Live backend source</p>
            <p className="mt-1 text-xl font-semibold">FastAPI + Supabase</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Signals</p>
            <p className="mt-2 text-3xl font-semibold">{signals.length}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Highest Score</p>
            <p className="mt-2 text-3xl font-semibold">
              {Math.max(...signals.map((signal) => signal.money_signal_score))}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">High Strength</p>
            <p className="mt-2 text-3xl font-semibold">
              {
                signals.filter(
                  (signal) => signal.signal_strength.toLowerCase() === "high"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Data Source</p>
            <p className="mt-2 text-3xl font-semibold">DB</p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {signals.map((signal) => (
            <article
              key={signal.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{signal.ticker}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {signal.company_name}
                  </p>
                </div>

                <div className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-bold text-slate-950">
                  {signal.money_signal_score}
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-400">{signal.sector}</p>

              <p className="mt-3 text-base font-medium text-emerald-300">
                {signal.signal_type}
              </p>

              <div className="mt-4 space-y-2 text-sm text-slate-400">
                <p>Strength: {signal.signal_strength}</p>
                <p>
                  Source: {signal.source_name} • {signal.source_type}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                {signal.explanation}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}