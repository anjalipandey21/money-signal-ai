"use client";

import { useEffect, useState } from "react";
import {
  getMarketDataHealth,
  type MarketDataHealthResponse,
} from "@/lib/moneySignalApi";

const fallbackHealth: MarketDataHealthResponse = {
  summary: {
    total: 0,
    fresh: 0,
    stale: 0,
    outdated: 0,
    pending: 0,
  },
  items: [],
};

export function useMarketDataHealth() {
  const [data, setData] = useState<MarketDataHealthResponse>(fallbackHealth);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadHealth() {
      try {
        setIsLoading(true);

        const response = await getMarketDataHealth();

        if (!isMounted) return;

        setData(response);
        setIsUsingFallback(false);
      } catch (error) {
        console.error("Failed to load market data health:", error);

        if (!isMounted) return;

        setData(fallbackHealth);
        setIsUsingFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHealth();

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