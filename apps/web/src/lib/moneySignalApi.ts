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

export type InstitutionalMove = {
  institution: string;
  ticker: string;
  action: string;
  value: string;
  time: string;
};

export type InsiderTrade = {
  insider: string;
  ticker: string;
  role: string;
  action: string;
  value: string;
  date: string;
};

export type AIMarketPulse = {
  title: string;
  summary: string;
  sentimentLabel: string;
  sentimentScore: number;
};

export type WatchlistPreviewItem = {
  ticker: string;
  change: string;
  trend: "positive" | "negative";
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

export async function getInstitutionalMoves() {
  return apiClient<InstitutionalMove[]>("/api/v1/dashboard/institutional-moves", {
    authToken: getAuthToken(),
  });
}

export async function getInsiderTrades() {
  return apiClient<InsiderTrade[]>("/api/v1/dashboard/insider-trades", {
    authToken: getAuthToken(),
  });
}

export async function getAIMarketPulse() {
  return apiClient<AIMarketPulse>("/api/v1/dashboard/ai-market-pulse", {
    authToken: getAuthToken(),
  });
}

export async function getWatchlistPreview() {
  return apiClient<WatchlistPreviewItem[]>("/api/v1/dashboard/watchlist-preview", {
    authToken: getAuthToken(),
  });
}