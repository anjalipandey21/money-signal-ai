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
  marketProvider?: string | null;
  priceFetchedAt?: string | null;
  marketTime?: string | null;
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
  marketProvider?: string | null;
  priceFetchedAt?: string | null;
  marketTime?: string | null;
  freshnessLabel: string;
};

type BackendWatchlistAsset = {
  id: number | string;
  ticker: string;
  companyName: string;
  sector?: string | null;
  industry?: string | null;

  // Now these come from backend/database market_snapshots
  price?: string | null;
  change?: string | null;
  changeAmount?: string | null;
  changePercent?: string | null;

  moneySignalScore?: number | null;
  scoreLabel?: string | null;
  trend?: string | null;
  latestSignal?: string | null;
  latestSignalType?: string | null;
  latestSignalDirection?: WatchlistDirection | string | null;
  createdAt?: string | null;
  marketProvider?: string | null;
  priceFetchedAt?: string | null;
  marketTime?: string | null;
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
  marketProvider?: string | null;
  priceFetchedAt?: string | null;
  marketTime?: string | null;
  freshnessLabel?: string;
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
  marketProvider?: string | null;
  priceFetchedAt?: string | null;
  marketTime?: string | null;
  freshnessLabel?: string;
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
  return {
    ticker: asset.ticker,
    companyName: asset.companyName,
    sector: asset.sector || asset.industry || "Unknown",

    // These now come from backend/database only
    price: asset.price ?? "$--",
    change: asset.change ?? asset.changePercent ?? "0.00%",

    score: Math.round(asset.moneySignalScore ?? 0),
    signal: normalizeSignalLabel(asset.latestSignalType ?? asset.latestSignal),
    direction: normalizeDirection(asset.latestSignalDirection),
    alertStatus: asset.scoreLabel || "Monitoring",
    lastUpdated: formatTimeLabel(asset.createdAt),
    marketProvider: asset.marketProvider,
    priceFetchedAt: asset.priceFetchedAt,
    marketTime: asset.marketTime,
    freshnessLabel: formatFreshnessLabel(
      asset.priceFetchedAt,
      asset.marketProvider
    ),
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
  // Backend now returns DB-backed market price/change.
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
  const response = await apiClient<BackendWatchlistAsset[]>("/api/watchlist", {
    authToken: getAuthToken(),
  });

  return response.map(mapBackendWatchlistAsset);
}

export async function getStockDetail(ticker: string) {
  const response = await apiClient<StockDetail>(`/api/stocks/${ticker}`, {
    authToken: getAuthToken(),
  });
  
  return {
    ...response,
    freshnessLabel: formatFreshnessLabel(
      response.priceFetchedAt,
      response.marketProvider
    ),
  };
}

export async function getStocks() {
  const response = await apiClient<StockListItem[]>("/api/stocks", {
    authToken: getAuthToken(),
  });

  return response.map((stock) => ({
    ...stock,
    freshnessLabel: formatFreshnessLabel(
      stock.priceFetchedAt,
      stock.marketProvider
    ),
  }));
}

export async function getWatchlistPreview() {
  return apiClient<WatchlistPreviewItem[]>(
    "/api/dashboard/watchlist-preview",
    {
      authToken: getAuthToken(),
    }
  );
}

export function formatFreshnessLabel(
  fetchedAt?: string | null,
  provider?: string | null
) {
  const providerLabel = provider
    ? provider
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Market source";

  if (!fetchedAt) {
    return `Price pending · ${providerLabel}`;
  }

  const date = new Date(fetchedAt);

  if (Number.isNaN(date.getTime())) {
    return `Fetched recently · ${providerLabel}`;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) {
    return `Fetched just now · ${providerLabel}`;
  }

  if (diffMinutes < 60) {
    return `Fetched ${diffMinutes}m ago · ${providerLabel}`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Fetched ${diffHours}h ago · ${providerLabel}`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `Fetched ${diffDays}d ago · ${providerLabel}`;
}