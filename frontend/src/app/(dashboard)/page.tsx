"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ExpenseDonut } from "@/components/dashboard/expense-donut";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  Package,
  PackageX,
  Clock,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
            Доброе утро, Иван
          </h1>
          <p className="text-text-secondary mt-1">
            Вот что происходит в вашем бизнесе сегодня
          </p>
        </div>
      </div>

      {/* Сетка KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Выручка · сегодня"
          value={data.kpi.revenue.value}
          suffix="₽"
          change={data.kpi.revenue.change}
          icon={<Banknote className="w-5 h-5" />}
          subtitle={`вчера ${data.kpi.revenue.previous.toLocaleString("ru-RU")} ₽`}
        />
        <KpiCard
          title="Остаток товаров"
          value={data.kpi.stock.value}
          suffix="поз."
          icon={<Package className="w-5 h-5" />}
          subtitle={
            <span className="inline-flex items-center gap-1 text-amber-400/90 font-medium">
              <AlertCircle className="w-3 h-3" /> {data.kpi.stock.low_stock}{" "}
              низких
            </span>
          }
        />
        <KpiCard
          title="Списания · сегодня"
          value={data.kpi.write_offs.value}
          suffix="₽"
          change={data.kpi.write_offs.change}
          icon={<PackageX className="w-5 h-5" />}
          subtitle={`вчера ${data.kpi.write_offs.previous.toLocaleString("ru-RU")} ₽`}
        />
        <KpiCard
          title="Смены"
          value={data.kpi.shifts.closed}
          suffix={`/ ${data.kpi.shifts.total}`}
          icon={<Clock className="w-5 h-5" />}
          subtitle={
            <span className="inline-flex items-center gap-1 text-rose-400/90 font-medium">
              <AlertCircle className="w-3 h-3" /> {data.kpi.shifts.open} не
              закрыта
            </span>
          }
        />
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart data={data.revenue_chart} />
        </div>
        <div>
          <ExpenseDonut data={data.expense_structure} />
        </div>
      </div>

      {/* Нижний ряд */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Последние операции */}
        <Card className="lg:col-span-2 p-6 bg-surface-1 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold text-text-primary">
              Последние операции
            </h3>
            <Link
              href="/operations"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Все операции →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium">
                    Дата
                  </th>
                  <th className="pb-3 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium">
                    Тип
                  </th>
                  <th className="pb-3 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium">
                    Товар / Причина
                  </th>
                  <th className="pb-3 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium">
                    Сотрудник
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recent_operations.map((op) => (
                  <tr
                    key={op.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 text-text-secondary whitespace-nowrap text-xs">
                      {op.date}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 font-normal border-0",
                          op.type === "write_off" &&
                            "text-rose-400 bg-rose-500/10",
                          op.type === "receipt" &&
                            "text-emerald-400 bg-emerald-500/10",
                          op.type === "shift_close" &&
                            "text-blue-400 bg-blue-500/10",
                          op.type === "inventory" &&
                            "text-amber-400 bg-amber-500/10"
                        )}
                      >
                        {op.type === "write_off" && (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {op.type === "receipt" && (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {op.type === "shift_close" && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {op.type === "inventory" && (
                          <Package className="w-3 h-3" />
                        )}
                        {op.type === "write_off"
                          ? "Списание"
                          : op.type === "receipt"
                          ? "Приход"
                          : op.type === "shift_close"
                          ? "Закрытие"
                          : "Инвентаризация"}
                      </Badge>
                    </td>
                    <td className="py-3 font-medium text-text-primary">
                      {op.item}
                    </td>
                    <td className="py-3 text-text-secondary text-xs">
                      {op.user}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Панель уведомлений */}
        <Card className="p-6 bg-surface-1 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              Требует внимания
            </h3>
            <Badge className="bg-gradient-accent text-black border-0 font-semibold">
              {data.alerts.length}
            </Badge>
          </div>
          <div className="space-y-1">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div
                  className={cn(
                    "mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ring-1 ring-white/[0.06]",
                    alert.type === "low_stock" &&
                      "bg-amber-500/10 text-amber-400",
                    alert.type === "shift_open" &&
                      "bg-orange-500/10 text-orange-400",
                    alert.type === "cash_diff" && "bg-rose-500/10 text-rose-400"
                  )}
                >
                  {alert.type === "low_stock" && (
                    <Package className="w-4 h-4" />
                  )}
                  {alert.type === "shift_open" && (
                    <Clock className="w-4 h-4" />
                  )}
                  {alert.type === "cash_diff" && (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {alert.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">
                    {alert.desc}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">
                    {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/operations"
            className="block text-center text-sm text-text-secondary hover:text-text-primary mt-4 transition-colors"
          >
            Все уведомления →
          </Link>
        </Card>
      </div>
    </div>
  );
}