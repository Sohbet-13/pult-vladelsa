"use client";

import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ExpenseDonutProps {
  data: { name: string; value: number; amount: number }[];
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ExpenseDonut({ data }: ExpenseDonutProps) {
  const total = data.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <Card className="p-6 bg-surface-1 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-1 text-text-primary">
        Структура расходов
      </h3>
      <p className="text-sm text-text-secondary mb-2">
        По категориям за период
      </p>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={92}
                paddingAngle={3}
                dataKey="amount"
                stroke="var(--surface-1)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(10, 11, 14, 0.95)",
                  backdropFilter: "blur(12px)",
                  color: "#EDEDF0",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  fontSize: 12,
                }}
                formatter={(value) => {
                  if (value === undefined) return "";
                  return new Intl.NumberFormat("ru-RU", {
                    style: "currency",
                    currency: "RUB",
                    maximumFractionDigits: 0,
                  }).format(Number(value));
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold tabular-nums text-text-primary">
            {new Intl.NumberFormat("ru-RU", {
              maximumFractionDigits: 0,
            }).format(total)}{" "}
            ₽
          </span>
          <span className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary mt-1">
            Всего
          </span>
        </div>
      </div>

      <div className="space-y-2.5 mt-4">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-text-secondary truncate">{item.name}</span>
            </div>
            <span className="font-medium tabular-nums text-text-primary">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}