"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueChartProps {
  data: { date: string; revenue: number; expenses: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="p-6 bg-surface-1 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Выручка и расходы
          </h3>
          <p className="text-sm text-text-secondary">
            Динамика за последние 7 дней
          </p>
        </div>
        <div className="flex gap-1 bg-surface-3 rounded-lg p-1">
          {["7 дн", "30 дн", "90 дн"].map((label, i) => (
            <button
              key={label}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                i === 0
                  ? "bg-surface-1 text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="kpiRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.30} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="kpiExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8A8F98", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8A8F98", fontSize: 11 }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.15)" }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(10, 11, 14, 0.95)",
                backdropFilter: "blur(12px)",
                color: "#EDEDF0",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                fontSize: 12,
              }}
              labelStyle={{ color: "#8A8F98", marginBottom: 4 }}
              formatter={(value) => {
                if (value === undefined) return "";
                return new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                  maximumFractionDigits: 0,
                }).format(Number(value));
              }}
            />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Выручка"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#kpiRevenue)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Расходы"
              stroke="var(--chart-2)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#kpiExpenses)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

