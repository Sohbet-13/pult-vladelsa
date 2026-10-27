"use client";

import { useMemo, useState } from "react";
import { Search, Filter, ArrowDownRight, ArrowUpRight, Clock, ArrowLeftRight, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useOperations, formatQuantity, operationLabel, type Operation, type OperationType } from "@/hooks/use-operations";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return dateFormatter.format(new Date(iso));
}

function formatDateOnly(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function typeBadgeStyles(type: OperationType): { className: string; icon: React.ReactNode } {
  switch (type) {
    case "write_off":
      return { className: "text-rose-400 border-rose-500/20 bg-rose-500/10", icon: <ArrowDownRight className="w-3 h-3" /> };
    case "receipt":
      return { className: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", icon: <ArrowUpRight className="w-3 h-3" /> };
    case "transfer":
      return { className: "text-blue-400 border-blue-500/20 bg-blue-500/10", icon: <ArrowLeftRight className="w-3 h-3" /> };
    case "inventory_adjustment":
      return { className: "text-amber-400 border-amber-500/20 bg-amber-500/10", icon: <Package className="w-3 h-3" /> };
    case "shift_open":
    case "shift_close":
      return { className: "text-slate-400 border-slate-500/20 bg-slate-500/10", icon: <Clock className="w-3 h-3" /> };
  }
}

function describeItems(op: Operation): string {
  if (!op.items.length) {
    if (op.closing_note) return op.closing_note;
    if (op.type === "shift_open") return "Смена открыта";
    if (op.type === "shift_close") return "Смена закрыта";
    return "—";
  }
  return op.items.map((i) => `${i.product_name} × ${formatQuantity(i)}`).join(", ");
}

const TYPE_OPTIONS: { value: OperationType | "all"; label: string }[] = [
  { value: "all", label: "Все операции" },
  { value: "write_off", label: "Списание" },
  { value: "receipt", label: "Приход" },
  { value: "shift_open", label: "Открытие смены" },
  { value: "shift_close", label: "Закрытие смены" },
];

export default function OperationsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState<OperationType | "all">("all");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = {
    type,
    search: debouncedSearch || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    per_page: 20,
  };

  const { data, isLoading, isFetching } = useOperations(filters);

  const operations = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = data?.last_page ?? 1;

  const hasFilters = type !== "all" || !!search || !!dateFrom || !!dateTo;

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setType("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Операции</h1>
          <p className="text-text-secondary mt-1">История всех складских операций и смен</p>
        </div>
        <div className="text-sm text-text-secondary">
          Всего: <span className="font-medium text-text-primary">{total}</span>
        </div>
      </div>

      <Card className="p-4 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <Input
                placeholder="Поиск по товару, сотруднику, причине…"
                className="pl-9 bg-surface-2 border-white/[0.06] text-text-primary placeholder:text-text-tertiary focus-visible:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={type} onValueChange={(v) => { setType((v as OperationType | "all") ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-1 text-text-tertiary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-text-tertiary whitespace-nowrap">Период:</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="bg-surface-2 border-white/[0.06] text-text-primary focus-visible:border-primary"
              />
              <span className="text-text-tertiary">—</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="bg-surface-2 border-white/[0.06] text-text-primary focus-visible:border-primary"
              />
            </div>

            {hasFilters && (
              <Button variant="outline" onClick={resetFilters} className="shrink-0 border-white/[0.06] bg-surface-2 text-text-primary hover:bg-surface-3">
                Сбросить
              </Button>
            )}
          </div>
        </div>
      </Card>

      {!isLoading && operations.length === 0 && (
        <Card className="p-12 text-center bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Package className="w-12 h-12 text-text-tertiary/40 mx-auto mb-3" />
          <p className="text-text-secondary">Операций пока нет.</p>
          {hasFilters && (
            <Button variant="link" onClick={resetFilters} className="mt-2 text-primary">
              Сбросить фильтры
            </Button>
          )}
        </Card>
      )}

      {isLoading && (
        <Card className="bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full bg-surface-2" />)}
        </Card>
      )}

      {!isLoading && operations.length > 0 && (
        <>
          <Card className="hidden md:block bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Сотрудник</TableHead>
                  <TableHead>Точка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((op) => {
                  const badge = typeBadgeStyles(op.type);
                  return (
                    <TableRow key={op.id}>
                      <TableCell className="text-text-secondary whitespace-nowrap text-xs">{formatDate(op.occurred_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1 font-normal", badge.className)}>
                          {badge.icon}
                          {operationLabel(op.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-text-primary max-w-[280px] truncate">{describeItems(op)}</TableCell>
                      <TableCell className="text-text-secondary">{op.reason?.name ?? "—"}</TableCell>
                      <TableCell className="text-text-secondary">{op.user?.name ?? "—"}</TableCell>
                      <TableCell className="text-text-secondary">{op.location?.name ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="md:hidden space-y-3">
            {operations.map((op) => {
              const badge = typeBadgeStyles(op.type);
              return (
                <Card key={op.id} className="p-4 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge variant="outline" className={cn("gap-1 font-normal", badge.className)}>
                      {badge.icon}
                      {operationLabel(op.type)}
                    </Badge>
                    <span className="text-xs text-text-tertiary whitespace-nowrap">{timeFormatter.format(new Date(op.occurred_at ?? new Date().toISOString()))}</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">{describeItems(op)}</p>
                  <div className="text-xs text-text-secondary space-y-0.5">
                    <p>{formatDateOnly(op.occurred_at)}</p>
                    {op.reason?.name && <p>Причина: {op.reason.name}</p>}
                    {op.user?.name && <p>Сотрудник: {op.user.name}</p>}
                    {op.location?.name && <p>Точка: {op.location.name}</p>}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!isLoading && total > 0 && lastPage > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            Страница <span className="font-medium text-text-primary">{page}</span> из <span className="font-medium text-text-primary">{lastPage}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 border-white/[0.06] bg-surface-2 text-text-primary hover:bg-surface-3" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="w-4 h-4" /> Назад
            </Button>
            <Button variant="outline" size="sm" className="gap-1 border-white/[0.06] bg-surface-2 text-text-primary hover:bg-surface-3" disabled={page >= lastPage || isFetching} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}>
              Вперёд <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}