import { apiClient } from "@/lib/apiClient";

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
  marketProvider?: string | null;
  priceFetchedAt?: string | null;
  marketTime?: string | null;
  freshnessLabel?: string;
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
  marketProvider?: string | null;
  priceFetchedAt?: string | null;
  marketTime?: string | null;
  freshnessLabel?: string;
};

export type MarketSnapshotResponse = {
  ticker: string;
  price: string;
  changeAmount: string;
  changePercent: string;
  marketProvider?: string | null;
  priceFetchedAt?: string | null;
  marketTime?: string | null;
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
  return undefined;
}

export async function getDashboardSummary() {
  return apiClient<DashboardSummary>("/dashboard/summary", {
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
    "/signals?limit=20",
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
    `/watchlist/${ticker}`,
    {
      method: "POST",
      authToken: getAuthToken(),
    }
  );
}

export async function removeWatchlistStock(ticker: string) {
  return apiClient<{ message: string; removed: WatchlistAsset }>(
    `/watchlist/${ticker}`,
    {
      method: "DELETE",
      authToken: getAuthToken(),
    }
  );
}

export async function getTopMoneySignalScores() {
  // Backend now returns DB-backed market price/change.
  return apiClient<TopMoneySignalScore[]>("/dashboard/top-scores", {
    authToken: getAuthToken(),
  });
}

export async function getInstitutionalMoves() {
  return apiClient<InstitutionalMove[]>("/dashboard/institutional-moves", {
    authToken: getAuthToken(),
  });
}

export async function getInsiderTrades() {
  return apiClient<InsiderTrade[]>("/dashboard/insider-trades", {
    authToken: getAuthToken(),
  });
}

export async function getAIMarketPulse() {
  return apiClient<AIMarketPulse>("/dashboard/ai-market-pulse", {
    authToken: getAuthToken(),
  });
}

export async function getWatchlist() {
  const response = await apiClient<BackendWatchlistAsset[]>("/watchlist", {
    authToken: getAuthToken(),
  });

  return response.map(mapBackendWatchlistAsset);
}

export async function getStockDetail(ticker: string) {
  const response = await apiClient<StockDetail>(`/stocks/${ticker}`, {
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

export async function getStocks(limit = 100, offset = 0, search = "") {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await apiClient<StockListItem[]>(
    `/stocks?${params.toString()}`,
    {
      authToken: getAuthToken(),
    }
  );

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
    "/dashboard/watchlist-preview",
    {
      authToken: getAuthToken(),
    }
  );
}

export async function getMarketDataHealth() {
  return apiClient<MarketDataHealthResponse>("/data-health/market", {
    authToken: getAuthToken(),
  });
}

export async function refreshMarketSnapshot(ticker: string) {
  return apiClient<MarketSnapshotResponse>(
    `/market/refresh/${ticker.toUpperCase()}`,
    {
      method: "POST",
      authToken: getAuthToken(),
    }
  );
}

export async function getStockQuote(ticker: string, refresh = false) {
  const query = refresh ? "?refresh=true" : "";

  const response = await apiClient<StockQuoteResponse>(
    `/stocks/quote/${ticker.toUpperCase()}${query}`,
    {
      authToken: getAuthToken(),
    }
  );

  return {
    ...response,
    freshnessLabel: formatFreshnessLabel(
      response.priceFetchedAt,
      response.marketProvider
    ),
  };
}

export async function getStockQuotes(tickers: string[], refresh = false) {
  const params = new URLSearchParams({
    tickers: tickers.map((ticker) => ticker.toUpperCase()).join(","),
  });

  if (refresh) {
    params.set("refresh", "true");
  }

  const response = await apiClient<StockQuoteResponse[]>(
    `/stocks/quotes?${params.toString()}`,
    {
      authToken: getAuthToken(),
    }
  );

  return response.map((quote) => ({
    ...quote,
    freshnessLabel: formatFreshnessLabel(
      quote.priceFetchedAt,
      quote.marketProvider
    ),
  }));
}

export async function getStockHistory(ticker: string, days = 30) {
  return apiClient<StockHistoryResponse>(
    `/stocks/history/${ticker.toUpperCase()}?days=${days}`,
    {
      authToken: getAuthToken(),
    }
  );
}

export async function getMarketOverview(limit = 25) {
  return apiClient<MarketOverviewResponse>(
    `/stocks/overview?limit=${limit}`,
    { authToken: getAuthToken() }
  );
}

export async function ingestRecentForm4(ticker: string, limit = 10) {
  return apiClient<unknown>(
    `/scraper/sec-form4/${ticker.toUpperCase()}/ingest-recent?limit=${limit}`,
    {
      method: "POST",
      authToken: getAuthToken(),
    }
  );
}

export async function ingestRecent13F(cik: string, limit = 3) {
  return apiClient<unknown>(
    `/scraper/sec-13f/${cik}/ingest-recent?limit=${limit}`,
    {
      method: "POST",
      authToken: getAuthToken(),
    }
  );
}

export async function runSchedulerScrape(ticker: string, limit = 10) {
  return apiClient<unknown>(
    `/scheduler/scrape/${ticker.toUpperCase()}?limit=${limit}`,
    {
      method: "POST",
      authToken: getAuthToken(),
    }
  );
}

export async function runFullIngestionPipeline({
  form4Limit = 5,
  thirteenFLimit = 3,
  refreshMarket = true,
  marketLimit = 25,
  timeoutMs = 15_000,
}: {
  form4Limit?: number;
  thirteenFLimit?: number;
  refreshMarket?: boolean;
  marketLimit?: number;
  timeoutMs?: number;
} = {}) {
  const params = new URLSearchParams({
    form4_limit: String(form4Limit),
    thirteen_f_limit: String(thirteenFLimit),
    refresh_market: String(refreshMarket),
    market_limit: String(marketLimit),
  });

  return apiClient<IngestionRunStartResponse>(
    `/scheduler/run-ingestion?${params.toString()}`,
    {
      method: "POST",
      authToken: getAuthToken(),
      timeoutMs,
    }
  );
}

export async function getSchedulerStatus() {
  return apiClient<SchedulerStatusResponse>("/scheduler/status", {
    authToken: getAuthToken(),
  });
}

export async function getScrapeHistory(limit = 25) {
  const response = await apiClient<ScrapeHistoryResponse>(
    `/scraper/history?limit=${limit}`,
    {
      authToken: getAuthToken(),
    }
  );

  return response.items;
}

export async function getScrapeHistoryRun(runId: string) {
  return apiClient<ScrapeHistoryDetailResponse>(
    `/scraper/history/${encodeURIComponent(runId)}`,
    {
      authToken: getAuthToken(),
    }
  );
}

export async function importSecCompanyUniverse({
  limit = 100,
  enrichProfile = false,
  includeFunds = false,
  includeOtc = false,
}: {
  limit?: number;
  enrichProfile?: boolean;
  includeFunds?: boolean;
  includeOtc?: boolean;
} = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    enrich_profile: String(enrichProfile),
    include_funds: String(includeFunds),
    include_otc: String(includeOtc),
  });

  return apiClient<SecCompanyUniverseImportResponse>(
    `/scraper/sec-company-universe/import?${params.toString()}`,
    {
      method: "POST",
      authToken: getAuthToken(),
    }
  );
}

export async function importStockUniverse(limit = 500) {
  return apiClient<StockUniverseImportResponse>(
    `/stocks/universe/import?limit=${limit}`,
    {
      method: "POST",
      authToken: getAuthToken(),
    }
  );
}

export async function getCompanyUniverseStats() {
  return apiClient<CompanyUniverseStats>("/stocks/universe/stats");
}

export async function refreshTrackedStockQuotes(limit = 100, offset = 0) {
  return apiClient<{
    count: number;
    results: {
      ticker: string;
      status: string;
      price?: string;
      changePercent?: string;
      provider?: string | null;
      priceFetchedAt?: string | null;
      error?: string;
    }[];
  }>(`/stocks/quotes/refresh-tracked?limit=${limit}&offset=${offset}`, {
    method: "POST",
    authToken: getAuthToken(),
  });
}

export async function trackStock(ticker: string) {
  return apiClient<unknown>(`/stocks/track/${ticker.toUpperCase()}`, {
    method: "POST",
    authToken: getAuthToken(),
  });
}

export type MarketDataHealthStatus =
  | "fresh"
  | "stale"
  | "outdated"
  | "pending";

export type MarketDataHealthSummary = {
  total: number;
  fresh: number;
  stale: number;
  outdated: number;
  pending: number;
};

export type MarketDataHealthItem = {
  ticker: string;
  companyName: string;
  status: MarketDataHealthStatus;
  provider: string | null;
  price: number | null;
  fetchedAt: string | null;
  ageMinutes: number | null;
};

export type MarketDataHealthResponse = {
  summary: MarketDataHealthSummary;
  items: MarketDataHealthItem[];
};

export type StockQuoteResponse = {
  ticker: string;
  companyName?: string;
  category?: string;
  price?: string;
  changeAmount?: string;
  changePercent?: string;
  marketProvider?: string | null;
  priceFetchedAt?: string | null;
  marketTime?: string | null;
  marketStatus?: string | null;
  isStale?: boolean;
  staleAfterMinutes?: number;
  quoteAgeMinutes?: number | null;
  error?: string;
  freshnessLabel?: string;
};

export type StockHistoryPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StockHistoryResponse = {
  ticker: string;
  days: number;
  data: StockHistoryPoint[];
};

export type MarketOverviewItem = {
  ticker: string;
  companyName: string;
  category: string;
  price: string | null;
  changeAmount: string | null;
  changePercent: string | null;
  marketProvider: string | null;
  priceFetchedAt: string | null;
  marketTime: string | null;
  moneySignalScore: number;
  scoreLabel: string;
  smartMoneyActivityCount: number;
  insiderActivityCount: number;
  fundActivityCount: number;
  latestInsiderActivity: {
    insider: string;
    type: string;
    value: string;
    tone: string;
    transactionDate: string | null;
  } | null;
  latestFundActivity: {
    institution: string;
    action: string;
    sharesChange: string;
    tone: string;
    quarter: string | null;
    marketValue: string;
    periodEndDate: string | null;
  } | null;
  latestSignal: {
    label: string;
    description: string;
    tone: string;
    sourceType: string;
    sourceName: string | null;
    detectedAt: string | null;
  } | null;
};

export type MarketOverviewResponse = {
  count: number;
  data: MarketOverviewItem[];
};

export type ScrapeHistoryItem = {
  id: number;
  runId?: string | null;
  ticker: string;
  sourceType: string;
  status: string;
  triggerSource?: string | null;
  triggeredBy?: string | null;
  filingsFound: number;
  filingsProcessed: number;
  filingsSkipped: number;
  filingsFailed: number;
  recordsCreated: number;
  durationSeconds?: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  limits?: {
    form4Limit?: number | null;
    thirteenFLimit?: number | null;
    marketLimit?: number | null;
    refreshMarket?: boolean | null;
  } | null;
  totals?: IngestionPipelineTotals | null;
  warningsCount?: number | null;
  errorsCount?: number | null;
  details?: ScrapeHistoryDetails | null;
};

export type ScrapeHistoryDetails = {
  runId?: string | null;
  status?: string;
  triggerSource?: string | null;
  triggeredBy?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationSeconds?: number | null;
  limits?: ScrapeHistoryItem["limits"];
  companiesFound?: number | null;
  companyUniverse?: CompanyUniverseStats | null;
  fundsFound?: number | null;
  form4LimitApplied?: boolean | null;
  marketLimitApplied?: boolean | null;
  stages?: IngestionStageResult[];
  totals?: IngestionPipelineTotals | null;
  warnings?: IngestionPipelineIssue[];
  errors?: IngestionPipelineIssue[];
  warningsCount?: number | null;
  errorsCount?: number | null;
  latestError?: string | null;
};

export type SchedulerStatusResponse = {
  running: boolean;
  currentRunId?: string | null;
  schedulerRunning?: boolean;
  jobs: {
    id: string;
    nextRunTime: string | null;
  }[];
  scheduleHours: number;
  maxFilings: number;
  thirteenFMaxFilings?: number;
  refreshMarket?: boolean;
  cooldownHours: number;
  latestRunId?: string | null;
  latestStatus?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  completedAt?: string | null;
  durationSeconds?: number | null;
  latestResult?: FullIngestionPipelineResponse | IngestionRunStartResponse | null;
  latestError?: string | null;
  error?: string | null;
  lastHeartbeatAt?: string | null;
  ingestionMaxRuntimeSeconds?: number;
};

export type StockUniverseImportResponse = {
  status: string;
  scanned: number;
  created: number;
  updated: number;
  skipped: number;
  limit: number;
};

export type SecCompanyUniverseImportResponse = StockUniverseImportResponse & {
  success: boolean;
  source: string;
  duplicateCikSkipped: number;
  enrichProfile: boolean;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
};

export type ScrapeHistoryResponse = {
  success: boolean;
  count: number;
  limit?: number;
  offset?: number;
  items: ScrapeHistoryItem[];
};

export type ScrapeHistoryDetailResponse = {
  success: boolean;
  item: ScrapeHistoryItem;
};

export type IngestionStageResult = {
  name?: string;
  stage: string;
  status?: "success" | "partial" | "skipped" | "failed" | string;
  success?: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
  durationSeconds?: number | null;
  message?: string | null;
  attempted?: number | null;
  processed?: number | null;
  created?: number | null;
  updated?: number | null;
  skipped?: number | null;
  failed?: number | null;
  recordsCreated?: number | null;
  warningCount?: number;
  errorCount?: number;
  staleSkipped?: number;
  providerFallbackCount?: number;
  providerFailureCount?: number;
  invalidTickerSkipped?: number;
  otcSkipped?: number;
  unsupportedTickerSkipped?: number;
  eligibleTickers?: number;
  filteredTickers?: number;
  skipReasons?: Record<string, number>;
  providerSummary?: Record<string, { success?: number; failed?: number; fallbacks?: number }>;
  skippedTickers?: string[];
  failedTickers?: string[];
  warnings?: IngestionPipelineIssue[];
  errors: IngestionPipelineIssue[];
};

export type IngestionPipelineIssue = {
  stage?: string;
  message: string;
  ticker?: string;
  fund?: string;
  cik?: string;
  accessionNumber?: string;
  exchange?: string | null;
  error?: string;
};

export type IngestionPipelineTotals = {
  attempted?: number;
  processed: number;
  skipped: number;
  failed: number;
  created?: number;
  updated?: number;
  recordsCreated: number;
  warnings?: number;
  errors?: number;
};

export type IngestionRunStartResponse = {
  success: boolean;
  status: "started" | "running" | string;
  runId: string | null;
  message: string;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  triggerSource?: string | null;
  triggeredBy?: string | null;
  form4Limit?: number;
  thirteenFLimit?: number;
  marketLimit?: number;
  refreshMarket?: boolean;
  historyId?: number;
};

export type FullIngestionPipelineResponse = {
  success: boolean;
  status: string;
  runId?: string | null;
  message?: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  triggerSource?: string | null;
  triggeredBy?: string | null;
  form4Limit?: number;
  thirteenFLimit?: number;
  marketLimit?: number;
  refreshMarket?: boolean;
  historyId?: number;
  companiesFound?: number;
  totalCompanies?: number;
  eligibleForm4Companies?: number;
  eligibleMarketCompanies?: number;
  form4LimitApplied?: boolean;
  marketLimitApplied?: boolean;
  companyUniverse?: CompanyUniverseStats;
  fundsFound?: number;
  stages?: IngestionStageResult[];
  totals?: IngestionPipelineTotals;
  warnings?: IngestionPipelineIssue[];
  errors?: IngestionPipelineIssue[];
  error?: string;
};

export type CompanyUniverseStats = {
  totalCompanies: number;
  companiesWithCik: number;
  companiesWithoutCik: number;
  eligibleForForm4: number;
  eligibleForMarketRefresh: number;
  byExchange: {
    exchange: string;
    count: number;
  }[];
};
