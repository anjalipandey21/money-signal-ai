export type Stock = {
  ticker: string;
  companyName: string;
  sector: string;
  price: number;
  dailyChange: number;
  dailyChangePercent: number;
  moneySignalScore: number;
  scoreLabel: string;
};

export type Signal = {
  id: string;
  ticker: string;
  signalEvent: string;
  signalType: string;
  score: number;
  confidence: "High" | "Medium" | "Low";
  source: string;
  aiContext: string;
  time: string;
};

export type InstitutionalMove = {
  institution: string;
  ticker: string;
  action: "Accumulate" | "Trim" | "New Position" | "Reduce";
  value: string;
  time: string;
};

export type InsiderTrade = {
  insider: string;
  company: string;
  ticker: string;
  type: string;
  value: string;
  time: string;
};

export type WatchlistItem = {
  ticker: string;
  companyName: string;
  sector: string;
  price: number;
  moneySignalScore: number;
  latestSignal: string;
  lastUpdated: string;
};