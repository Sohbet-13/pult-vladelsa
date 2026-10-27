import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type OperationType =
  | "write_off"
  | "receipt"
  | "transfer"
  | "inventory_adjustment"
  | "shift_open"
  | "shift_close";

export interface OperationItem {
  product_id: number;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_cost: number | null;
  unit: { code: string; name: string; decimal_places: number } | null;
}

export interface Operation {
  id: string;
  source: "stock_document" | "shift";
  document_id?: number;
  shift_id?: number;
  type: OperationType;
  status: string;
  occurred_at: string | null;
  location: { id: number; name: string } | null;
  user: { id: number; name: string } | null;
  reason: { id: number; name: string } | null;
  items: OperationItem[];
  comment: string | null;
  closing_note: string | null;
}

export interface OperationsResponse {
  current_page: number;
  data: Operation[];
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface OperationsFilters {
  type?: OperationType | "all";
  search?: string;
  location_id?: number | null;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export function useOperations(filters: OperationsFilters) {
  return useQuery({
    queryKey: ["operations", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filters.page ?? 1,
        per_page: filters.per_page ?? 20,
      };

      if (filters.type && filters.type !== "all") params.type = filters.type;
      if (filters.search) params.search = filters.search;
      if (filters.location_id) params.location_id = filters.location_id;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const { data } = await api.get<OperationsResponse>("/api/v1/operations", { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function formatQuantity(item: OperationItem): string {
  const raw = item.quantity;
  const unit = item.unit;
  const formatted =
    unit && unit.decimal_places === 0
      ? String(Math.trunc(raw))
      : raw.toFixed(unit?.decimal_places ?? 2).replace(/\.?0+$/, "");

  const unitLabel = !unit
    ? ""
    : unit.code === "pcs"
      ? " шт"
      : unit.code === "l"
        ? " л"
        : unit.code === "kg"
          ? " кг"
          : " " + unit.code;

  return formatted + unitLabel;
}

export function operationLabel(type: OperationType): string {
  switch (type) {
    case "write_off":
      return "Списание";
    case "receipt":
      return "Приход";
    case "transfer":
      return "Перемещение";
    case "inventory_adjustment":
      return "Корректировка";
    case "shift_open":
      return "Открытие смены";
    case "shift_close":
      return "Закрытие смены";
  }
}