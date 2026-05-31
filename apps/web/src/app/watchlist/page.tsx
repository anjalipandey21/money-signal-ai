"use client";

import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { WatchlistMonitoredAssets } from "@/components/watchlist/WatchlistMonitoredAssets";
import { addWatchlistStock } from "@/lib/moneySignalApi";

function AddStockModal({
  isOpen,
  onClose,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [ticker, setTicker] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTicker = ticker.trim().toUpperCase();

    if (!cleanTicker) {
      setError("Please enter a ticker symbol.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      await addWatchlistStock(cleanTicker);

      setSuccessMessage(`${cleanTicker} added to your watchlist.`);
      setTicker("");
      onAdded();

      window.setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 900);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add this stock right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded border border-[#424754] bg-[#0D121F] p-6 shadow-[0_0_30px_rgba(59,130,246,0.25)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold text-[#e0e2ed]">
              Add Stock
            </h2>
            <p className="mt-1 text-sm text-[#c2c6d6]">
              Add a ticker to monitor institutional and insider money movement.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#c2c6d6] transition hover:bg-[#181c23] hover:text-[#e0e2ed]"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="ticker"
              className="mb-2 block font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]"
            >
              Ticker Symbol
            </label>

            <input
              id="ticker"
              value={ticker}
              onChange={(event) => setTicker(event.target.value.toUpperCase())}
              placeholder="Example: AAPL, MSFT, GOOGL"
              className="w-full rounded border border-[#424754] bg-[#10131b] px-4 py-3 font-mono text-[#e0e2ed] outline-none transition placeholder:text-[#8c909f] focus:border-[#adc6ff]"
            />
          </div>

          {error ? (
            <div className="rounded border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-3 py-2 text-sm text-[#ffb4ab]">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded border border-[#4edea3]/40 bg-[#4edea3]/10 px-3 py-2 text-sm text-[#4edea3]">
              {successMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#424754] px-4 py-2 text-sm font-medium text-[#c2c6d6] transition hover:bg-[#181c23] hover:text-[#e0e2ed]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
          <span className="text-xs font-medium text-[#4edea3]">Bullish</span>
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

      <MaterialIcon
        name="grid_view"
        className="mb-3 text-[32px] text-[#8c909f]"
      />

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
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [watchlistRefreshKey, setWatchlistRefreshKey] = useState(0);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

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

            <button
              type="button"
              onClick={() => setAlertsEnabled((current) => !current)}
              className={`relative flex h-4 w-8 items-center rounded-full px-0.5 transition-colors ${
                alertsEnabled ? "bg-[#4d8eff]" : "bg-[#424754]"
              }`}
            >
              <span
                className={`absolute h-3 w-3 rounded-full bg-[#10131b] shadow-sm transition-all ${
                  alertsEnabled ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddStockOpen(true)}
            className="flex items-center gap-2 rounded bg-[#3B82F6] px-4 py-1.5 font-medium text-white transition-colors hover:bg-blue-600"
          >
            <MaterialIcon name="add" className="text-sm" />
            Add Stock
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WatchlistMonitoredAssets key={watchlistRefreshKey} />
        </div>

        <aside className="space-y-6">
          <WatchlistIntelligenceCard />
          <SectorHeatmapCard />
        </aside>
      </section>

      <p className="pt-10 text-center text-sm text-[#c2c6d6]">
        Research only. Not financial advice.
      </p>

      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        onAdded={() => setWatchlistRefreshKey((current) => current + 1)}
      />
    </AppShell>
  );
}