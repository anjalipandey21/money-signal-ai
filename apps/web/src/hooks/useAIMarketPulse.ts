"use client";

import { useEffect, useState } from "react";
import { getAIMarketPulse, type AIMarketPulse } from "@/lib/moneySignalApi";

const fallbackAIMarketPulse: AIMarketPulse = {
  title: "Institutional Rotation",
  summary:
    "Data indicates a significant shift from Megacap Tech into Mid-cap Energy. AI sentiment remains net positive but shows exhaustion in semiconductor manufacturing.",
  sentimentLabel: "Macro Sentiment",
  sentimentScore: 62,
};

export function useAIMarketPulse() {
  const [data, setData] = useState<AIMarketPulse>(fallbackAIMarketPulse);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAIMarketPulse() {
      try {
        setIsLoading(true);

        const response = await getAIMarketPulse();

        if (!isMounted) return;

        setData(response);
        setIsUsingFallback(false);
      } catch (error) {
        console.error("Failed to load AI market pulse:", error);

        if (!isMounted) return;

        setData(fallbackAIMarketPulse);
        setIsUsingFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAIMarketPulse();

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