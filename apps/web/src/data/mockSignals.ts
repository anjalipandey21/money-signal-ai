import type { Signal } from "@/types/moneySignal";

export const mockSignals: Signal[] = [
  {
    id: "sig-001",
    ticker: "NVDA",
    signalEvent: "Multi-Fund Buying",
    signalType: "Institutional Accumulation",
    score: 92,
    confidence: "High",
    source: "13F Comparison",
    aiContext:
      "Multiple institutions increased NVDA exposure across recent 13F filings, suggesting elevated institutional accumulation.",
    time: "Today",
  },
  {
    id: "sig-002",
    ticker: "GOOGL",
    signalEvent: "New High-Conviction Fund Position",
    signalType: "New Fund Position",
    score: 89,
    confidence: "High",
    source: "SEC 13F-HR",
    aiContext:
      "A concentrated fund opened a meaningful GOOGL position, creating a strong public-disclosure money movement signal.",
    time: "1d ago",
  },
  {
    id: "sig-003",
    ticker: "MSFT",
    signalEvent: "Institutional Accumulation",
    signalType: "Institutional Accumulation",
    score: 85,
    confidence: "Medium",
    source: "13F Comparison",
    aiContext:
      "Several funds modestly increased MSFT exposure, creating a positive but moderate accumulation signal.",
    time: "2d ago",
  },
  {
    id: "sig-004",
    ticker: "PLTR",
    signalEvent: "Insider Open-Market Buy",
    signalType: "Insider Buy",
    score: 79,
    confidence: "Medium",
    source: "Form 4",
    aiContext:
      "Recent insider buying may indicate internal confidence, though the signal should be reviewed with valuation and company context.",
    time: "3d ago",
  },
];