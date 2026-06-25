"use client";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useTopMoneySignalScores } from "@/hooks/useTopMoneySignalScores";
import { useEffect, useState } from "react";
import {
  formatFreshnessLabel,
  getStockQuotes,
  type StockQuoteResponse,
  type TopMoneySignalScore,
} from "@/lib/moneySignalApi";

export function TopMoneySignalScores() {
  const { data, isLoading, isUsingFallback } = useTopMoneySignalScores();
  const [liveQuotes, setLiveQuotes] = useState<Record<string, StockQuoteResponse>>({});

  useEffect(() => {
    async function loadLiveQuotes() {
      try {
        const tickers = data.map((card) => card.ticker).filter(Boolean);

        if (tickers.length === 0) return;

        const quotes = await getStockQuotes(tickers);

        const quoteMap = quotes.reduce<Record<string, StockQuoteResponse>>(
          (acc, quote) => {
            acc[quote.ticker] = quote;
            return acc;
          },
          {}
        );

        setLiveQuotes(quoteMap);
      } catch (error) {
        console.error("Failed to load live quotes:", error);
      }
    }

    loadLiveQuotes();
  }, [data]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#e0e2ed]">
          <MaterialIcon name="stars" fill className="text-[22px] text-[#adc6ff]" />
          <h2 className="text-[18px] font-semibold">Top MoneySignal Scores</h2>

          <span
            className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
              isUsingFallback
                ? "border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]"
                : "border border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]"
            }`}
          >
            {isLoading ? "Loading" : isUsingFallback ? "Fallback" : "Live"}
          </span>
        </div>

        <Link
          href="/stocks"
          className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6] hover:text-[#adc6ff]"
        >
          View All Tickers
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.map((card) => (
          <ScoreCard
            key={card.ticker}
            card={card}
            quote={liveQuotes[card.ticker]}
          />
        ))}
      </div>
    </section>
  );
}

function ScoreCard({ card, quote, }: {  card: TopMoneySignalScore;  quote?: StockQuoteResponse;}) {
  return (
    <Link
      href={`/stocks/${card.ticker}`}
      className="block rounded border border-[#424754]/50 bg-[#181c23] p-4 transition-all hover:border-[#adc6ff]/50 hover:bg-[#1c2027]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-[20px] font-semibold text-[#e0e2ed]">
            {card.ticker}
          </h3>

          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#c2c6d6]">
            {card.company}
          </p>
        </div>

        <div className="rounded border border-[#4edea3]/30 bg-[#4edea3]/10 px-3 py-1 font-mono text-[12px] text-[#4edea3]">
          {card.score}
        </div>
      </div>

      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
        Price
      </p>

      <div className="flex items-end justify-between">
        <p className="text-[18px] font-semibold text-[#e0e2ed]">
          {quote?.price ?? card.price}
        </p>

        <p className="font-mono text-[12px] text-[#4edea3]">
          {quote?.changePercent ?? card.change}
        </p>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
        {quote?.freshnessLabel ?? formatFreshnessLabel(card.priceFetchedAt, card.marketProvider)}
      </p>
    </Link>
    
  );
}