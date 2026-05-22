type StockSignal = {
  ticker: string;
  company_name: string;
  sector: string;
  money_signal_score: number;
  signal_type: string;
  signal_strength: string;
  explanation: string;
};

async function getDashboardSignals(): Promise<StockSignal[]> {
  const response = await fetch("http://localhost:8001/api/dashboard/signals", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard signals");
  }

  return response.json();
}

export default async function DashboardPage() {
  const stocks = await getDashboardSignals();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
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

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {stocks.map((stock) => (
            <div
              key={stock.ticker}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{stock.ticker}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {stock.company_name}
                  </p>
                </div>

                <div className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-bold text-slate-950">
                  {stock.money_signal_score}
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-400">{stock.sector}</p>

              <p className="mt-3 text-base font-medium text-emerald-300">
                {stock.signal_type}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Strength: {stock.signal_strength}
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                {stock.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}