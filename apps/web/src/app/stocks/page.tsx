"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  getStocks,
  getStockQuotes,
  type StockListItem,
  type StockQuoteResponse,
} from "@/lib/moneySignalApi";


const fallbackStocks: StockListItem[] = [
  {
    ticker: "GOOGL",
    companyName: "Alphabet Inc.",
    category: "Internet / Advertising",
    price: "$174.55",
    changeAmount: "+1.05",
    changePercent: "0.60%",
    moneySignalScore: 83,
    scoreLabel: "Bullish",
  },
  {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    category: "Technology / Semiconductors",
    price: "$875.28",
    changeAmount: "+24.15",
    changePercent: "2.84%",
    moneySignalScore: 92,
    scoreLabel: "Strong Bullish",
  },
  {
    ticker: "MSFT",
    companyName: "Microsoft Corporation",
    category: "Cloud / AI Infrastructure",
    price: "$421.12",
    changeAmount: "+5.82",
    changePercent: "1.40%",
    moneySignalScore: 86,
    scoreLabel: "Bullish",
  },
  {
    ticker: "META",
    companyName: "Meta Platforms",
    category: "Social / AI",
    price: "$502.18",
    changeAmount: "+10.35",
    changePercent: "2.10%",
    moneySignalScore: 89,
    scoreLabel: "Strong Bullish",
  },
];

function signalTone(stock: StockListItem) {
  const label = stock.scoreLabel.toLowerCase();

  if (stock.moneySignalScore >= 75 || label.includes("bullish")) {
    return {
      label: "Bullish",
      className: "border-[#4edea3]/30 bg-[#4edea3]/10 text-[#4edea3]",
    };
  }

  if (stock.moneySignalScore <= 40 || label.includes("bearish")) {
    return {
      label: "Bearish",
      className: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]",
    };
  }

  return {
    label: "Neutral",
    className: "border-[#8c909f]/40 bg-[#8c909f]/10 text-[#c2c6d6]",
  };
}

function sourceLabel(stock: StockListItem, quote?: StockQuoteResponse) {
  if (quote?.marketProvider || stock.marketProvider) {
    return "Market";
  }

  if (stock.priceFetchedAt || quote?.priceFetchedAt) {
    return "Market";
  }

  return "MoneySignal";
}

function stockReason(stock: StockListItem) {
  if (stock.scoreLabel && stock.scoreLabel !== "Monitoring") {
    return `${stock.scoreLabel} MoneySignal profile based on tracked public signals.`;
  }

  return "Monitoring for market, Form 4, 13F, and AI signal updates.";
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, StockQuoteResponse>>({});

  useEffect(() => {
  let isMounted = true;

  async function loadStocks() {
    try {
      setIsLoading(true);

      const data = await getStocks();

      if (!isMounted) return;

      setStocks(data);
      setIsUsingFallback(false);
    } catch (error) {
      console.error("Failed to load stocks:", error);

      if (!isMounted) return;

      setStocks(fallbackStocks);
      setIsUsingFallback(true);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  loadStocks();

  return () => {
    isMounted = false;
  };
}, []);
  
  useEffect(() => {
    let isMounted = true;

    async function loadLiveQuotes() {
      try {
        const tickers = Array.from(
          new Set(stocks.map((stock) => stock.ticker).filter(Boolean))
        );

        if (tickers.length === 0) return;

        const quotes = await getStockQuotes(tickers);

        if (!isMounted) return;

        const quoteMap = quotes.reduce<Record<string, StockQuoteResponse>>(
          (acc, quote) => {
            if (!quote.error) {
              acc[quote.ticker] = quote;
            }
            return acc;
          },
          {}
        );

        setLiveQuotes(quoteMap);
      } catch (error) {
        console.error("Failed to load stock list live quotes:", error);
      }
    }

  loadLiveQuotes();

  const intervalId = window.setInterval(loadLiveQuotes, 60_000);

  return () => {
    isMounted = false;
    window.clearInterval(intervalId);
  };
}, [stocks]);

  return (
    <AppShell activePage="Stocks">
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#e0e2ed]">
            Stocks
          </h1>

          <p className="mt-2 text-[14px] text-[#c2c6d6]">
            Browse tracked companies ranked by MoneySignal score.
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${
            isUsingFallback
              ? "border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]"
              : "border border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]"
          }`}
        >
          {isLoading ? "Loading" : isUsingFallback ? "Fallback" : "Live"}
        </span>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stocks.map((stock) => {
            const quote = liveQuotes[stock.ticker];
            const displayPrice = quote?.price ?? stock.price;
            const displayChangePercent = quote?.changePercent ?? stock.changePercent ?? "0.00%";
            const displayFreshness = quote?.freshnessLabel ?? stock.freshnessLabel;
            const isNegative = displayChangePercent.startsWith("-");
            const tone = signalTone(stock);
            return (
          <Link
            key={stock.ticker}
            href={`/stocks/${stock.ticker}`}
            className="group rounded border border-[#424754]/50 bg-[#181c23] p-5 transition-all hover:border-[#adc6ff]/50 hover:bg-[#1c2027]"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-semibold text-[#e0e2ed]">
                  {stock.ticker}
                </h2>

                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#c2c6d6]">
                  {stock.companyName}
                </p>
              </div>

              <MaterialIcon
                name="open_in_new"
                className="text-[18px] text-[#8c909f] opacity-0 transition group-hover:opacity-100"
              />
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone.className}`}
              >
                {tone.label}
              </span>
              <span className="rounded border border-[#424754]/50 bg-[#0d121f] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#c2c6d6]">
                Source: {sourceLabel(stock, quote)}
              </span>
            </div>

            <p className="mb-4 text-sm text-[#8c909f]">{stock.category}</p>

            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
                  Price
                </p>
                <p className="mt-1 text-[18px] font-semibold text-[#e0e2ed]">
                  {displayPrice}
                </p>
                {displayFreshness ? (
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
                    {displayFreshness}
                  </p>
                ) : null}
              </div>

              <p
                className={`font-mono text-[13px] ${
                  isNegative
                    ? "text-[#ffb4ab]"
                    : "text-[#4edea3]"
                }`}
              >
                {displayChangePercent}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[#424754]/40 pt-4">
              <div className="min-w-0 pr-3">
                <span className="block text-sm text-[#c2c6d6]">
                  {stock.scoreLabel}
                </span>
                <span className="mt-1 line-clamp-2 block text-[12px] leading-5 text-[#8c909f]">
                  {stockReason(stock)}
                </span>
              </div>

              <span className="shrink-0 rounded border border-[#4edea3]/30 bg-[#4edea3]/10 px-3 py-1 font-mono text-[13px] text-[#4edea3]">
                {stock.moneySignalScore}
              </span>
            </div>
          </Link>
          );
        })}
      </section>

      {!isLoading && stocks.length === 0 ? (
        <div className="rounded border border-[#424754]/50 bg-[#181c23] p-8 text-center text-[#c2c6d6]">
          No tracked stocks found.
        </div>
      ) : null}
    </AppShell>
  );
}
