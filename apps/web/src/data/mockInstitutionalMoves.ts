import type { InstitutionalMove } from "@/types/moneySignal";

export const mockInstitutionalMoves: InstitutionalMove[] = [
  {
    institution: "Tiger Global",
    ticker: "NVDA",
    action: "Accumulate",
    value: "$820M",
    time: "Today",
  },
  {
    institution: "Berkshire Hathaway",
    ticker: "GOOGL",
    action: "New Position",
    value: "$1.2B",
    time: "1d ago",
  },
  {
    institution: "Coatue Management",
    ticker: "MSFT",
    action: "Accumulate",
    value: "$640M",
    time: "2d ago",
  },
  {
    institution: "ARK Invest",
    ticker: "TSLA",
    action: "Trim",
    value: "$210M",
    time: "3d ago",
  },
];