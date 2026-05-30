"use client";

import { useEffect, useState } from "react";
import { getInsiderTrades, type InsiderTrade } from "@/lib/moneySignalApi";

const fallbackInsiderTrades: InsiderTrade[] = [
  {
    insider: "Tim Cook",
    ticker: "AAPL",
    role: "CEO",
    action: "Sell",
    value: "$33.2M",
    date: "Today",
  },
  {
    insider: "Mark Zuckerberg",
    ticker: "META",
    role: "CEO",
    action: "Sell",
    value: "$18.5M",
    date: "Yesterday",
  },
  {
    insider: "Jensen Huang",
    ticker: "NVDA",
    role: "CEO",
    action: "Sell",
    value: "$24.1M",
    date: "2d ago",
  },
];

export function useInsiderTrades() {
  const [data, setData] = useState<InsiderTrade[]>(fallbackInsiderTrades);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInsiderTrades() {
      try {
        setIsLoading(true);

        const response = await getInsiderTrades();

        if (!isMounted) return;

        setData(response);
        setIsUsingFallback(false);
      } catch (error) {
        console.error("Failed to load insider trades:", error);

        if (!isMounted) return;

        setData(fallbackInsiderTrades);
        setIsUsingFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInsiderTrades();

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