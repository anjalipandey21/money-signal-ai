"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { getStocks, type StockListItem } from "@/lib/moneySignalApi";

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

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStocks() {
      try {
        setIsLoading(true);

        const response = await getStocks();

        if (!isMounted) return;

        setStocks(response);
        setIsUsingFallback(false);
      } catch (error) {
        console.error("Failed to load stocks:", error);

        if (!isMounted) return;

        setStocks([fallbackStocks]);
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
        {stocks.map((stock) => (
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

            <p className="mb-4 text-sm text-[#8c909f]">{stock.category}</p>

            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
                  Price
                </p>
                <p className="mt-1 text-[18px] font-semibold text-[#e0e2ed]">
                  {stock.price}
                </p>
              </div>

              <p
                className={`font-mono text-[13px] ${
                  stock.changePercent.startsWith("-")
                    ? "text-[#ffb4ab]"
                    : "text-[#4edea3]"
                }`}
              >
                {stock.changePercent}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[#424754]/40 pt-4">
              <span className="text-sm text-[#c2c6d6]">
                {stock.scoreLabel}
              </span>

              <span className="rounded border border-[#4edea3]/30 bg-[#4edea3]/10 px-3 py-1 font-mono text-[13px] text-[#4edea3]">
                {stock.moneySignalScore}
              </span>
            </div>
          </Link>
        ))}
      </section>

      {!isLoading && stocks.length === 0 ? (
        <div className="rounded border border-[#424754]/50 bg-[#181c23] p-8 text-center text-[#c2c6d6]">
          No tracked stocks found.
        </div>
      ) : null}
    </AppShell>
  );
}