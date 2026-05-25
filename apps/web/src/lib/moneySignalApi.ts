import { apiClient } from "@/lib/apiClient";
import { getAuthSession } from "@/lib/authSession";

export type DashboardSummary = {
  moneySignalScore: number;
  activeSignals: number;
  bullishSignals: number;
  bearishSignals: number;
  watchlistCount: number;
};

export type SignalItem = {
  id: string;
  ticker: string;
  companyName: string;
  signalType: string;
  direction: "bullish" | "bearish" | "mixed" | "neutral";
  score: number;
  source: string;
  summary: string;
  detectedAt: string;
};

export type TopMoneySignalScore = {
  ticker: string;
  company: string;
  price: string;
  change: string;
  score: number;
};

function getAuthToken() {
  const session = getAuthSession();
  return session?.token;
}

export async function getDashboardSummary() {
  return apiClient<DashboardSummary>("/api/v1/dashboard/summary", {
    authToken: getAuthToken(),
  });
}

export async function getSignals() {
  return apiClient<SignalItem[]>("/api/v1/signals", {
    authToken: getAuthToken(),
  });
}

export async function getWatchlist() {
  return apiClient<SignalItem[]>("/api/v1/watchlist", {
    authToken: getAuthToken(),
  });
}

export async function getTopMoneySignalScores() {
  return apiClient<TopMoneySignalScore[]>("/api/v1/dashboard/top-scores", {
    authToken: getAuthToken(),
  });
}