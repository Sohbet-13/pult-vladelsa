import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ReportChartPoint {
  date: string;
  revenue: number;
  write_offs: number;
  receipts: number;
}

export interface ReportTopProduct {
  product_id: number;
  product_name: string;
  sku: string | null;
  unit_code: string | null;
  unit_decimal_places: number | null;
  quantity: number;
  operations: number;
}

export interface ReportTopReason {
  reason_id: number;
  reason_name: string;
  count: number;
}

export interface ReportTopEmployee {
  user_id: number;
  name: string;
  count: number;
}

export interface ReportByType {
  type: string;
  count: number;
}

export interface ReportSummary {
  period: { from: string; to: string };
  kpi: {
    revenue: number;
    expenses: number;
    write_offs_count: number;
    write_offs_quantity: number;
    receipts_count: number;
    receipts_quantity: number;
    shifts_closed: number;
    shifts_open: number;
  };
  chart: ReportChartPoint[];
  top_products: ReportTopProduct[];
  top_reasons: ReportTopReason[];
  top_employees: ReportTopEmployee[];
  by_type: ReportByType[];
}

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
}

export function useReports(
  filters: ReportFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["reports-summary", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const { data } = await api.get<ReportSummary>("/api/v1/reports/summary", {
        params,
      });
      return data;
    },
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
  });
}

export function formatQuantityValue(
  value: number,
  unitCode: string | null,
  decimalPlaces: number | null
): string {
  const formatted =
    decimalPlaces === 0
      ? String(Math.trunc(value))
      : value.toFixed(decimalPlaces ?? 2).replace(/\.?0+$/, "");

  const suffix =
    unitCode === "pcs"
      ? " шт"
      : unitCode === "l"
        ? " л"
        : unitCode === "kg"
          ? " кг"
          : unitCode
            ? " " + unitCode
            : "";

  return formatted + suffix;
}

export function typeLabel(type: string): string {
  switch (type) {
    case "write_off":
      return "Списание";
    case "receipt":
      return "Приход";
    case "transfer":
      return "Перемещение";
    case "inventory_adjustment":
      return "Корректировка";
    default:
      return type;
  }
}