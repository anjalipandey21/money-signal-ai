"use client";

import { useEffect, useState } from "react";
import {
  getInstitutionalMoves,
  type InstitutionalMove,
} from "@/lib/moneySignalApi";

const fallbackInstitutionalMoves: InstitutionalMove[] = [
  {
    institution: "BlackRock Inc.",
    ticker: "TSLA",
    action: "Accumulate",
    value: "$1.2B",
    time: "09:42 EST",
  },
  {
    institution: "Vanguard Group",
    ticker: "AAPL",
    action: "Accumulate",
    value: "$840M",
    time: "11:15 EST",
  },
  {
    institution: "Goldman Sachs",
    ticker: "NFLX",
    action: "Trim",
    value: "$420M",
    time: "13:22 EST",
  },
  {
    institution: "JPMorgan Chase",
    ticker: "AMD",
    action: "Accumulate",
    value: "$310M",
    time: "14:05 EST",
  },
];

export function useInstitutionalMoves() {
  const [data, setData] = useState<InstitutionalMove[]>(fallbackInstitutionalMoves);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInstitutionalMoves() {
      try {
        setIsLoading(true);

        const response = await getInstitutionalMoves();

        if (!isMounted) return;

        setData(response);
        setIsUsingFallback(false);
      } catch (error) {
        console.error("Failed to load institutional moves:", error);

        if (!isMounted) return;

        setData(fallbackInstitutionalMoves);
        setIsUsingFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInstitutionalMoves();

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