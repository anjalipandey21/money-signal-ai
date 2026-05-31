"use client";

import { useEffect, useState } from "react";
import {
  getTopMoneySignalScores,
  type TopMoneySignalScore,
} from "@/lib/moneySignalApi";

const fallbackTopScores: TopMoneySignalScore[] = [
  {
    ticker: "GOOGL",
    company: "Alphabet Inc.",
    price: "$174.52",
    change: "+2.4%",
    score: 91,
  },
  {
    ticker: "NVDA",
    company: "NVIDIA Corp.",
    price: "$128.61",
    change: "+4.1%",
    score: 88,
  },
  {
    ticker: "MSFT",
    company: "Microsoft Corp.",
    price: "$442.10",
    change: "+0.8%",
    score: 85,
  },
  {
    ticker: "META",
    company: "Meta Platforms",
    price: "$502.14",
    change: "+1.9%",
    score: 82,
  },
];

export function useTopMoneySignalScores() {
  const [data, setData] = useState<TopMoneySignalScore[]>(fallbackTopScores);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTopScores() {
      try {
        setIsLoading(true);

        const response = await getTopMoneySignalScores();

        if (!isMounted) return;

        setData(response);
        setIsUsingFallback(false);
      } catch (error) {
        console.error("Failed to load top MoneySignal scores:", error);

        if (!isMounted) return;

        setData(fallbackTopScores);
        setIsUsingFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTopScores();

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