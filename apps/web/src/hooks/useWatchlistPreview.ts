"use client";

import { useEffect, useState } from "react";
import {
  getWatchlistPreview,
  type WatchlistPreviewItem,
} from "@/lib/moneySignalApi";

const fallbackWatchlistPreview: WatchlistPreviewItem[] = [
  { ticker: "TSLA", change: "-1.42%", trend: "negative" },
  { ticker: "AMD", change: "+3.15%", trend: "positive" },
  { ticker: "AVGO", change: "+0.88%", trend: "positive" },
  { ticker: "PLTR", change: "+5.42%", trend: "positive" },
];

export function useWatchlistPreview() {
  const [data, setData] = useState<WatchlistPreviewItem[]>(fallbackWatchlistPreview);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadWatchlistPreview() {
      try {
        setIsLoading(true);

        const response = await getWatchlistPreview();

        if (!isMounted) return;

        setData(response);
        setIsUsingFallback(false);
      } catch (error) {
        console.error("Failed to load watchlist preview:", error);

        if (!isMounted) return;

        setData(fallbackWatchlistPreview);
        setIsUsingFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWatchlistPreview();

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