"use client";

import { useMemo, useState } from "react";
import { Banknote, PackageX, PackagePlus, Clock, Download } from "lucide-react";
import { useReports, formatQuantityValue, typeLabel, type ReportSummary } from "@/hooks/use-reports";
import { useToday, daysBefore } from "@/hooks/use-today";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

const moneyFmt = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const moneyCompact = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0, notation: "compact" });

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function exportCsv(data: ReportSummary) {
  const lines: string[] = [];
  lines.push(`Отчёт за период;${data.period.from};${data.period.to}`);
  lines.push("");
  lines.push("KPI;Значение");
  lines.push(`Выручка;${data.kpi.revenue}`);
  lines.push(`Расходы;${data.kpi.expenses}`);
  lines.push(`Списаний (кол-во);${data.kpi.write_offs_count}`);
  lines.push(`Списано товаров;${data.kpi.write_offs_quantity}`);
  lines.push(`Приходов (кол-во);${data.kpi.receipts_count}`);
  lines.push(`Принято товаров;${data.kpi.receipts_quantity}`);
  lines.push(`Смен закрыто;${data.kpi.shifts_closed}`);
  lines.push(`Смен открыто;${data.kpi.shifts_open}`);
  lines.push("");
  lines.push("Топ товаров по списаниям;SKU;Кол-во;Операций");
  for (const p of data.top_products) lines.push(`${p.product_name};${p.sku ?? ""};${p.quantity};${p.operations}`);
  lines.push("");
  lines.push("Топ причин;Количество");
  for (const r of data.top_reasons) lines.push(`${r.reason_name};${r.count}`);
  lines.push("");
  lines.push("Топ сотрудников;Действий");
  for (const e of data.top_employees) lines.push(`${e.name};${e.count}`);

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${data.period.from}_${data.period.to}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type Preset = 7 | 30 | 90 | "custom";

export default function ReportsPage() {
  const today = useToday();
  const datesReady = !!today;

  const [preset, setPreset] = useState<Preset>(30);
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const dateFrom = customFrom || (today ? daysBefore(today, 29) : "");
  const dateTo = customTo || today;

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p === "custom" || !today) return;
    setCustomFrom(daysBefore(today, p - 1));
    setCustomTo(today);
  };

  const filters = useMemo(() => ({ date_from: dateFrom, date_to: dateTo }), [dateFrom, dateTo]);
  const { data, isLoading, isFetching } = useReports(filters, { enabled: datesReady });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Аналитика и отчёты</h1>
          <p className="text-text-secondary mt-1">Сводные показатели за выбранный период</p>
        </div>
        <Button variant="outline" className="gap-2 border-white/[0.06] bg-surface-2 text-text-primary hover:bg-surface-3" onClick={() => data && exportCsv(data)} disabled={!data || isLoading}>
          <Download className="w-4 h-4" /> Экспорт CSV
        </Button>
      </div>

      <Card className="p-4 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {[{ v: 7 as Preset, label: "7 дней" }, { v: 30 as Preset, label: "30 дней" }, { v: 90 as Preset, label: "90 дней" }].map((opt) => (
              <Button key={String(opt.v)} variant={preset === opt.v ? "default" : "outline"} size="sm" onClick={() => applyPreset(opt.v)} disabled={!datesReady} className={preset === opt.v ? "bg-gradient-accent text-black font-medium hover:opacity-90" : "border-white/[0.06] bg-surface-2 text-text-primary hover:bg-surface-3"}>
                {opt.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-text-tertiary whitespace-nowrap">С:</span>
              <Input type="date" value={dateFrom} onChange={(e) => { setCustomFrom(e.target.value); setPreset("custom"); }} className="bg-surface-2 border-white/[0.06] text-text-primary focus-visible:border-primary" />
              <span className="text-text-tertiary">—</span>
              <Input type="date" value={dateTo} onChange={(e) => { setCustomTo(e.target.value); setPreset("custom"); }} className="bg-surface-2 border-white/[0.06] text-text-primary focus-visible:border-primary" />
            </div>
            {isFetching && !isLoading && <span className="text-xs text-text-tertiary">Обновление…</span>}
          </div>
        </div>
      </Card>

      {(!datesReady || (isLoading && !data)) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl bg-surface-2" />)}
          </div>
          <Skeleton className="h-[360px] rounded-xl bg-surface-2" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[240px] rounded-xl bg-surface-2" />)}
          </div>
        </>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Выручка" value={moneyFmt.format(data.kpi.revenue)} icon={<Banknote className="w-5 h-5" />} />
            <KpiCard title="Списания" value={`${data.kpi.write_offs_count} / ${formatQty(data.kpi.write_offs_quantity)}`} subtitle={`${data.kpi.write_offs_count} операций`} icon={<PackageX className="w-5 h-5" />} />
            <KpiCard title="Приходы" value={`${data.kpi.receipts_count} / ${formatQty(data.kpi.receipts_quantity)}`} subtitle={`${data.kpi.receipts_count} операций`} icon={<PackagePlus className="w-5 h-5" />} />
            <KpiCard title="Смены" value={`${data.kpi.shifts_closed} закрыто`} subtitle={data.kpi.shifts_open > 0 ? `${data.kpi.shifts_open} открыта` : "Все смены закрыты"} icon={<Clock className="w-5 h-5" />} />
          </div>

          <Card className="p-6 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Динамика по дням</h3>
                <p className="text-sm text-text-secondary">Выручка и объём складских операций</p>
              </div>
            </div>

            {data.chart.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8A8F98", fontSize: 11 }} tickFormatter={formatDayLabel} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8A8F98", fontSize: 11 }} tickFormatter={(v) => moneyCompact.format(v)} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(10, 11, 14, 0.95)", backdropFilter: "blur(12px)", color: "#EDEDF0", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", fontSize: 12 }} 
                      labelStyle={{ color: "#8A8F98", marginBottom: 4 }}
                      labelFormatter={(label) => formatDayLabel(String(label))} 
                      formatter={(value, name) => { if (value === undefined) return ""; if (name === "revenue") return moneyFmt.format(Number(value)); return String(value); }} 
                    />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                    <Area type="monotone" dataKey="revenue" name="Выручка" stroke="var(--chart-1)" strokeWidth={2} fillOpacity={1} fill="url(#reportRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary text-center py-10">Нет данных за выбранный период.</p>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TopList title="Топ товаров по списаниям" items={data.top_products.map((p) => ({ key: `p-${p.product_id}`, label: p.product_name, sub: `${p.operations} операций`, value: formatQuantityValue(p.quantity, p.unit_code, p.unit_decimal_places) }))} />
            <TopList title="Причины списаний" items={data.top_reasons.map((r) => ({ key: `r-${r.reason_id}`, label: r.reason_name, value: `${r.count}` }))} />
            <TopList title="Сотрудники" items={data.top_employees.map((e) => ({ key: `u-${e.user_id}`, label: e.name, value: `${e.count}` }))} />
          </div>

          <Card className="p-6 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Разбивка по типам операций</h3>
            {data.by_type.length === 0 ? (
              <p className="text-sm text-text-tertiary">Нет данных</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.by_type.map((row) => (
                  <Badge key={row.type} variant="outline" className="px-3 py-1.5 text-sm font-normal border-white/[0.06] bg-surface-2 text-text-secondary">
                    {typeLabel(row.type)}: <span className="font-medium ml-1 text-text-primary">{row.count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon: React.ReactNode; }) {
  return (
    <Card className="p-5 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start justify-between">
        <div className="space-y-2 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">{title}</p>
          <h3 className="text-2xl font-semibold tracking-tight tabular-nums text-text-primary truncate">{value}</h3>
          {subtitle && <p className="text-xs text-text-tertiary">{subtitle}</p>}
        </div>
        <div className="text-text-tertiary opacity-40 shrink-0 ml-2">{icon}</div>
      </div>
    </Card>
  );
}

function TopList({ title, items }: { title: string; items: { key: string; label: string; sub?: string; value: string }[]; }) {
  return (
    <Card className="p-6 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <h3 className="text-sm font-semibold mb-4 text-text-primary">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-tertiary">Нет данных</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.key} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-text-primary truncate">{it.label}</p>
                {it.sub && <p className="text-xs text-text-tertiary mt-0.5">{it.sub}</p>}
              </div>
              <span className="font-medium tabular-nums text-text-primary whitespace-nowrap">{it.value}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function formatQty(v: number): string {
  if (v === 0) return "0";
  return v.toFixed(2).replace(/\.?0+$/, "");
}