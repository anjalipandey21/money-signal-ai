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

type BackendWatchlistAsset = {
  id: number | string;
  ticker: string;
  companyName: string;
  sector?: string | null;
  industry?: string | null;
  moneySignalScore?: number | null;
  scoreLabel?: string | null;
  trend?: string | null;
  latestSignal?: string | null;
  latestSignalType?: string | null;
  latestSignalDirection?: WatchlistDirection | string | null;
  createdAt?: string | null;
};

type MarketSnapshot = {
  price: string;
  change: string;
  changeAmount: string;
  changePercent: string;
};

const DEMO_MARKET_SNAPSHOT: Record<string, MarketSnapshot> = {
  NVDA: {
    price: "$875.28",
    change: "+2.84%",
    changeAmount: "+24.15",
    changePercent: "2.84%",
  },
  GOOGL: {
    price: "$174.52",
    change: "+2.4%",
    changeAmount: "+4.10",
    changePercent: "2.4%",
  },
  MSFT: {
    price: "$442.61",
    change: "+1.2%",
    changeAmount: "+5.22",
    changePercent: "1.2%",
  },
  META: {
    price: "$501.24",
    change: "+1.8%",
    changeAmount: "+8.84",
    changePercent: "1.8%",
  },
  AAPL: {
    price: "$189.98",
    change: "+0.8%",
    changeAmount: "+1.51",
    changePercent: "0.8%",
  },
  TSLA: {
    price: "$175.34",
    change: "-1.4%",
    changeAmount: "-2.48",
    changePercent: "-1.4%",
  },
  AMD: {
    price: "$164.20",
    change: "+3.1%",
    changeAmount: "+4.95",
    changePercent: "3.1%",
  },
  AVGO: {
    price: "$1,331.00",
    change: "+0.8%",
    changeAmount: "+10.59",
    changePercent: "0.8%",
  },
  PLTR: {
    price: "$21.84",
    change: "+5.4%",
    changeAmount: "+1.12",
    changePercent: "5.4%",
  },
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

function formatTimeLabel(value?: string | null) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function normalizeDirection(direction?: string | null): WatchlistDirection {
  if (
    direction === "bullish" ||
    direction === "bearish" ||
    direction === "mixed" ||
    direction === "neutral"
  ) {
    return direction;
  }

  return "neutral";
}

function normalizeSignalLabel(value?: string | null) {
  if (!value) return "Money Signal";

  return value.replaceAll("_", " ").toUpperCase();
}

function getMarketSnapshot(ticker: string): MarketSnapshot {
  return (
    DEMO_MARKET_SNAPSHOT[ticker.toUpperCase()] ?? {
      price: "$--",
      change: "0.0%",
      changeAmount: "0.00",
      changePercent: "0.00%",
    }
  );
}

function mapBackendSignal(signal: BackendSignalItem): SignalItem {
  return {
    id: String(signal.id),
    ticker: signal.ticker,
    signalEvent: normalizeSignalLabel(signal.signalType ?? signal.title),
    score: Math.round(signal.moneySignalScore ?? signal.strength ?? 0),
    confidence: Math.round(signal.confidence ?? 0),
    source: signal.sourceName ?? signal.sourceType ?? "Tracked Source",
    aiContext:
      signal.explanation ?? signal.title ?? "No explanation available yet.",
    time: formatTimeLabel(signal.detectedAt),
    direction: normalizeDirection(signal.direction),
  };
}

function mapBackendWatchlistAsset(asset: BackendWatchlistAsset): WatchlistAsset {
  const market = getMarketSnapshot(asset.ticker);

  return {
    ticker: asset.ticker,
    companyName: asset.companyName,
    sector: asset.sector || asset.industry || "Unknown",
    price: market.price,
    change: market.change,
    score: Math.round(asset.moneySignalScore ?? 0),
    signal: normalizeSignalLabel(asset.latestSignalType ?? asset.latestSignal),
    direction: normalizeDirection(asset.latestSignalDirection),
    alertStatus: asset.scoreLabel || "Monitoring",
    lastUpdated: formatTimeLabel(asset.createdAt),
  };
}

function getAuthToken() {
  const session = getAuthSession();
  return session?.token;
}

export async function getDashboardSummary() {
  return apiClient<DashboardSummary>("/api/dashboard/summary", {
    authToken: getAuthToken(),
  });
}

export type SignalDirectionFilter =
  | "all"
  | "bullish"
  | "bearish"
  | "mixed"
  | "neutral";

export async function getSignals(direction: SignalDirectionFilter = "all") {
  const response = await apiClient<BackendSignalItem[]>(
    "/api/signals?limit=20",
    {
      authToken: getAuthToken(),
    }
  );

  const mappedSignals = response.map(mapBackendSignal);

  if (direction === "all") {
    return mappedSignals;
  }

  return mappedSignals.filter((signal) => signal.direction === direction);
}

export async function addWatchlistStock(ticker: string) {
  return apiClient<{ message: string; ticker: string; watchlistId: number }>(
    `/api/watchlist/${ticker}`,
    {
      method: "POST",
      authToken: getAuthToken(),
    }
  );
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
  const response = await apiClient<TopMoneySignalScore[]>(
    "/api/dashboard/top-scores",
    {
      authToken: getAuthToken(),
    }
  );

  return response.map((stock) => {
    const market = getMarketSnapshot(stock.ticker);

    return {
      ...stock,
      price: market.price,
      change: market.change,
    };
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
  const response = await apiClient<BackendWatchlistAsset[]>("/api/watchlist", {
    authToken: getAuthToken(),
  });

  return response.map(mapBackendWatchlistAsset);
}

export async function getStockDetail(ticker: string) {
  const response = await apiClient<StockDetail>(`/api/stocks/${ticker}`, {
    authToken: getAuthToken(),
  });

  const market = getMarketSnapshot(response.ticker);

  return {
    ...response,
    price: market.price,
    changeAmount: market.changeAmount,
    changePercent: market.changePercent,
  };
}

export async function getStocks() {
  const response = await apiClient<StockListItem[]>("/api/stocks", {
    authToken: getAuthToken(),
  });

  return response.map((stock) => {
    const market = getMarketSnapshot(stock.ticker);

    return {
      ...stock,
      price: market.price,
      changeAmount: market.changeAmount,
      changePercent: market.changePercent,
    };
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