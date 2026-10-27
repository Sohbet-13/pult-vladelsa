import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { isAxiosError } from "axios";

export interface StockReason {
  id: number;
  name: string;
  requires_comment: boolean;
}

export function useStockReasons(type: 'write_off' | 'receipt' = 'write_off') {
  return useQuery({
    queryKey: ["stock-reasons", type],
    queryFn: async () => {
      const { data } = await api.get<StockReason[]>("/api/v1/stock/reasons", { params: { type } });
      return data;
    },
  });
}

export function useWriteOff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { product_id: number; location_id: number; quantity: number; reason_id: number; comment?: string }) => {
      const { data } = await api.post("/api/v1/stock/write-off", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Списание успешно проведено");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: unknown) => {
      let message = "Ошибка при списании";
      if (isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    }
  });
}

export function useReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { product_id: number; location_id: number; quantity: number; reason_id: number; comment?: string }) => {
      const { data } = await api.post("/api/v1/stock/receipt", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Приход успешно оформлен");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: unknown) => {
      let message = "Ошибка при приходе";
      if (isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    }
  });
}