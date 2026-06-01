import { apiClient } from "@/lib/apiClient";
import { getAuthSession } from "@/lib/authSession";

export type DashboardSummary = {
  moneySignalScore: number;
  activeSignals: number;
  bullishSignals: number;
  bearishSignals: number;
  watchlistCount: number;
};

type BackendSignalItem = {
  id: number | string;
  ticker: string;
  companyName?: string;
  sector?: string | null;
  signalType?: string;
  sourceType?: string;
  sourceName?: string | null;
  direction?: "bullish" | "bearish" | "mixed" | "neutral" | string;
  strength?: number;
  confidence?: number;
  scoreImpact?: number;
  moneySignalScore?: number | null;
  scoreLabel?: string | null;
  title?: string;
  explanation?: string | null;
  detectedAt?: string | null;
};

export type SignalItem = {
  id: string;
  ticker: string;
  signalEvent: string;
  score: number;
  confidence: number;
  source: string;
  aiContext: string;
  time: string;
  direction: "bullish" | "bearish" | "mixed" | "neutral";
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
  trend: "positive" | "negative" | "neutral";
};

export type WatchlistDirection = "bullish" | "bearish" | "mixed" | "neutral";

export type WatchlistAsset = {
  ticker: string;
  companyName: string;
  sector: string;
  price: string;
  change: string;
  score: number;
  signal: string;
  direction: WatchlistDirection;
  alertStatus: string;
  lastUpdated: string;
};

export type StockTone =
  | "positive"
  | "negative"
  | "neutral"
  | "primary"
  | "secondary";

export type StockFactor = {
  label: string;
  value: number;
  tone: StockTone;
};

export type StockFundMovement = {
  institution: string;
  action: string;
  sharesChange: string;
  tone: StockTone;
};

export type StockInsiderTrade = {
  insider: string;
  type: string;
  value: string;
  tone: StockTone;
};

export type StockTimelineEvent = {
  label: string;
  time: string;
  description: string;
  tone: StockTone;
};

export type StockDetail = {
  ticker: string;
  companyName: string;
  category: string;
  price: string;
  changeAmount: string;
  changePercent: string;
  moneySignalScore: number;
  scoreLabel: string;
  executiveSummary: string;
  whyItMatters: string;
  watchNext: string[];
  riskNote: string;
  factorBreakdown: StockFactor[];
  fundMovement: StockFundMovement[];
  insiderTrades: StockInsiderTrade[];
  timeline: StockTimelineEvent[];
};

  export type StockListItem = {
    ticker: string;
    companyName: string;
    category: string;
    price: string;
    changeAmount: string;
    changePercent: string;
    moneySignalScore: number;
    scoreLabel: string;
  };

function getAuthToken() {
  const session = getAuthSession();
  return session?.token;
}

export async function getDashboardSummary() {
  return apiClient<DashboardSummary>("/api/dashboard/summary", {
    authToken: getAuthToken(),
  });
}

export type SignalDirectionFilter = "all" | "bullish" | "mixed";

export async function getSignals(direction: SignalDirectionFilter = "all") {
  const query = direction === "all" ? "" : `?direction=${direction}`;

  return apiClient<SignalItem[]>(`/api/signals${query}`, {
    authToken: getAuthToken(),
  });
}

export async function addWatchlistStock(ticker: string) {
  return apiClient<WatchlistAsset>("/api/watchlist", {
    method: "POST",
    authToken: getAuthToken(),
    body: JSON.stringify({ ticker }),
  });
}

export async function removeWatchlistStock(ticker: string) {
  return apiClient<{ message: string; removed: WatchlistAsset }>(
    `/api/watchlist/${ticker}`,
    {
      method: "DELETE",
      authToken: getAuthToken(),
    }
  );
}

export async function getTopMoneySignalScores() {
  return apiClient<TopMoneySignalScore[]>("/api/dashboard/top-scores", {
    authToken: getAuthToken(),
  });
}

export async function getInstitutionalMoves() {
  return apiClient<InstitutionalMove[]>("/api/dashboard/institutional-moves", {
    authToken: getAuthToken(),
  });
}

export async function getInsiderTrades() {
  return apiClient<InsiderTrade[]>("/api/dashboard/insider-trades", {
    authToken: getAuthToken(),
  });
}

export async function getAIMarketPulse() {
  return apiClient<AIMarketPulse>("/api/dashboard/ai-market-pulse", {
    authToken: getAuthToken(),
  });
}

export async function getWatchlist() {
  return apiClient<WatchlistAsset[]>("/api/watchlist", {
    authToken: getAuthToken(),
  });
}

export async function getStockDetail(ticker: string) {
  return apiClient<StockDetail>(`/api/stocks/${ticker}`, {
    authToken: getAuthToken(),
  });
}

export async function getStocks() {
  return apiClient<StockListItem[]>("/api/stocks", {
    authToken: getAuthToken(),
  });
}

export async function getWatchlistPreview() {
  return apiClient<WatchlistPreviewItem[]>(
    "/api/dashboard/watchlist-preview",
    {
      authToken: getAuthToken(),
    }
  );
}
