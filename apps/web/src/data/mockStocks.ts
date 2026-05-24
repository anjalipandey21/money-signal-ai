import type { Stock } from "@/types/moneySignal";

export const mockStocks: Stock[] = [
  {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    sector: "Technology / Semiconductors",
    price: 875.28,
    dailyChange: 24.15,
    dailyChangePercent: 2.84,
    moneySignalScore: 92,
    scoreLabel: "Strong Bullish",
  },
  {
    ticker: "GOOGL",
    companyName: "Alphabet Inc.",
    sector: "Communication Services",
    price: 176.42,
    dailyChange: 2.11,
    dailyChangePercent: 1.21,
    moneySignalScore: 89,
    scoreLabel: "Strong",
  },
  {
    ticker: "MSFT",
    companyName: "Microsoft Corporation",
    sector: "Technology",
    price: 421.55,
    dailyChange: 3.87,
    dailyChangePercent: 0.92,
    moneySignalScore: 85,
    scoreLabel: "Strong",
  },
  {
    ticker: "META",
    companyName: "Meta Platforms Inc.",
    sector: "Communication Services",
    price: 512.18,
    dailyChange: -4.62,
    dailyChangePercent: -0.89,
    moneySignalScore: 82,
    scoreLabel: "Positive",
  },
];