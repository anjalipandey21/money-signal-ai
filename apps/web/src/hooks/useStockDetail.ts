"use client";

import { useEffect, useState } from "react";
import {
  getStockDetail,
  getStockQuote,
  getStockHistory,
  type StockDetail,
  type StockHistoryPoint,
} from "@/lib/moneySignalApi";

const fallbackStockDetail: StockDetail = {
  ticker: "NVDA",
  companyName: "NVIDIA Corporation",
  category: "Technology / Semiconductors",
  price: "$875.28",
  changeAmount: "+24.15",
  changePercent: "2.84%",
  moneySignalScore: 92,
  scoreLabel: "Strong Bullish",
  executiveSummary:
    "NVIDIA maintains strong momentum driven by unprecedented data center demand. Supply constraints are easing, and next-generation Blackwell architecture announcements are expected to serve as a positive near-term catalyst.",
  whyItMatters:
    "Institutional accumulation remains extremely high (+14% QoQ in Top 50 funds). Option chain signals indicate aggressive short-dated call buying, suggesting anticipation of near-term catalyst. Supply chain data correlates with an upside surprise in data center revenue.",
  watchNext: ["GTC Conference Keynote (Mar 18)", "TSMC Monthly Revenue Report"],
  riskNote:
    "Model confidence slightly reduced due to historical high volatility around current valuation multiples. Regulatory export restrictions present asymmetric downside risk.",
  factorBreakdown: [
    { label: "Institutional Flow", value: 98, tone: "positive" },
    { label: "Multi-Fund Presence", value: 94, tone: "positive" },
    { label: "Signal Freshness", value: 85, tone: "primary" },
    { label: "Insider Selling", value: 22, tone: "negative" },
    { label: "Confidence", value: 88, tone: "primary" },
  ],
  fundMovement: [
    {
      institution: "Renaissance Technologies",
      action: "New",
      sharesChange: "+1.2M",
      tone: "positive",
    },
    {
      institution: "Two Sigma Advisers",
      action: "Add",
      sharesChange: "+450K",
      tone: "primary",
    },
    {
      institution: "Bridgewater Associates",
      action: "Reduce",
      sharesChange: "-120K",
      tone: "negative",
    },
  ],
  insiderTrades: [
    {
      insider: "Huang Jen Hsun (CEO)",
      type: "Sale (10b5-1)",
      value: "$24.5M",
      tone: "neutral",
    },
    {
      insider: "Kress Colette (CFO)",
      type: "Sale (10b5-1)",
      value: "$8.2M",
      tone: "neutral",
    },
    {
      insider: "Stevens Mark A (Dir)",
      type: "Grant",
      value: "$1.1M",
      tone: "primary",
    },
  ],
  timeline: [
    {
      label: "Options Flow",
      time: "2h ago",
      description: "Unusual Call Volume detected at $950 strike exp. 03/15.",
      tone: "secondary",
    },
    {
      label: "Analyst Action",
      time: "5h ago",
      description: "Goldman Sachs reiterates Conviction Buy, raises PT to $1000.",
      tone: "positive",
    },
    {
      label: "News Context",
      time: "1d ago",
      description: "Meta announces major infrastructure build-out utilizing H100s.",
      tone: "neutral",
    },
    {
      label: "13F Update",
      time: "2d ago",
      description: "Top 50 funds increased positions by 14% QoQ.",
      tone: "primary",
    },
    {
      label: "Form 4",
      time: "3d ago",
      description: "CEO Huang Jen Hsun sold 100K shares ($24.5M) via 10b5-1.",
      tone: "negative",
    },
  ],
};

export function useStockDetail(ticker: string, historyDays = 30) {
  const [data, setData] = useState<StockDetail>(fallbackStockDetail);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [history, setHistory] = useState<StockHistoryPoint[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadStockDetail() {
      try {
        setIsLoading(true);

        const detail = await getStockDetail(ticker);
        const historyResponse = await getStockHistory(ticker, historyDays);


        try {
          const quote = await getStockQuote(ticker);

          if (!isMounted) return;

            setData({
              ...detail,
              price: quote.price ?? detail.price,
              changeAmount: quote.changeAmount ?? detail.changeAmount,
              changePercent: quote.changePercent ?? detail.changePercent,
              marketProvider: quote.marketProvider ?? detail.marketProvider,
              priceFetchedAt: quote.priceFetchedAt ?? detail.priceFetchedAt,
              marketTime: quote.marketTime ?? detail.marketTime,
              freshnessLabel: quote.freshnessLabel ?? detail.freshnessLabel,
            });

            setHistory(historyResponse.data);
            setIsUsingFallback(false);

            setIsUsingFallback(false);
        } catch (quoteError) {
          console.error("Failed to load live stock quote:", quoteError);
          if (!isMounted) return;
            setData(detail);
            setIsUsingFallback(false);
        }
      } catch (error) {
        console.error("Failed to load stock detail:", error);
        if (!isMounted) return;
        setData(fallbackStockDetail);
        setIsUsingFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStockDetail();

    return () => {
      isMounted = false;
    };
  }, [ticker, historyDays]);
  
  return {
    data,
    history,
    isLoading,
    isUsingFallback,
  };
}