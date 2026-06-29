"use client";

import { useEffect, useState } from "react";
import { getWatchlist, type WatchlistAsset } from "@/lib/moneySignalApi";

const fallbackWatchlistAssets: WatchlistAsset[] = [
  {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    sector: "Semiconductors",
    price: "$128.61",
    change: "+4.1%",
    score: 92,
    signal: "Institutional Accumulation",
    direction: "bullish",
    alertStatus: "Active",
    lastUpdated: "Today, 09:42 EST",
    freshnessLabel: "Demo fallback",
  },
  {
    ticker: "PLTR",
    companyName: "Palantir Technologies",
    sector: "Software",
    price: "$21.44",
    change: "+5.8%",
    score: 88,
    signal: "Insider Hold",
    direction: "bullish",
    alertStatus: "Active",
    lastUpdated: "Today, 10:18 EST",
    freshnessLabel: "Demo fallback",
  },
  {
    ticker: "TSLA",
    companyName: "Tesla Inc.",
    sector: "Auto / EV",
    price: "$177.02",
    change: "-1.42%",
    score: 45,
    signal: "Conflicting Signal",
    direction: "mixed",
    alertStatus: "Watch",
    lastUpdated: "Yesterday, 15:05 EST",
    freshnessLabel: "Demo fallback",
  },
];

export function useWatchlistAssets() {
  const [data, setData] = useState<WatchlistAsset[]>(fallbackWatchlistAssets);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadWatchlist() {
      try {
        setIsLoading(true);

        const response = await getWatchlist();

        if (!isMounted) return;

        setData(response);
        setIsUsingFallback(false);
      } catch (error) {
        console.error("Failed to load watchlist:", error);

        if (!isMounted) return;

        setData(fallbackWatchlistAssets);
        setIsUsingFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWatchlist();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    isLoading,
    isUsingFallback,
  };
}
