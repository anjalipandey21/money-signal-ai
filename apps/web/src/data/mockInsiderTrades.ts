import type { InsiderTrade } from "@/types/moneySignal";

export const mockInsiderTrades: InsiderTrade[] = [
  {
    insider: "Director",
    company: "Palantir Technologies Inc.",
    ticker: "PLTR",
    type: "Open-Market Buy",
    value: "$750K",
    time: "3d ago",
  },
  {
    insider: "Chief Financial Officer",
    company: "Microsoft Corporation",
    ticker: "MSFT",
    type: "Option Exercise",
    value: "$1.4M",
    time: "5d ago",
  },
  {
    insider: "Chief Executive Officer",
    company: "NVIDIA Corporation",
    ticker: "NVDA",
    type: "Sale 10b5-1",
    value: "$24.1M",
    time: "1w ago",
  },
];