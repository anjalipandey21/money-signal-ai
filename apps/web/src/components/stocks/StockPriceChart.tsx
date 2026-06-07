"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { StockHistoryPoint } from "@/lib/moneySignalApi";

type StockPriceChartProps = {
  history: StockHistoryPoint[];
};

export function StockPriceChart({ history }: StockPriceChartProps) {
  if (!history.length) {
    return (
      <p className="text-sm text-[#8c909f]">
        No price history available.
      </p>
    );
  }

  const chartData = history.map((point) => ({
    date: point.date.slice(5),
    close: point.close,
  }));

  return (
    <div className="h-[280px] min-h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#8c909f" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#8c909f" }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#181c23",
              border: "1px solid #424754",
              color: "#e0e2ed",
            }}
            labelStyle={{ color: "#c2c6d6" }}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#4edea3"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}