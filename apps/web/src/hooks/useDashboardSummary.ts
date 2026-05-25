"use client";

import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "@/lib/moneySignalApi";

const fallbackDashboardSummary: DashboardSummary = {
  moneySignalScore: 87,
  activeSignals: 24,
  bullishSignals: 16,
  bearishSignals: 5,
  watchlistCount: 8,
};

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary>(fallbackDashboardSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardSummary() {
      try {
        setIsLoading(true);

        const response = await getDashboardSummary();

        if (!isMounted) return;

        setData(response);
        setIsUsingFallback(false);
      } catch (error) {
        console.error("Failed to load dashboard summary:", error);

        if (!isMounted) return;

        setData(fallbackDashboardSummary);
        setIsUsingFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardSummary();

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