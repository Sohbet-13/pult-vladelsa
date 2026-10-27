import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { isAxiosError } from "axios";

export interface ShiftPayment {
  id: number;
  payment_method: string;
  expected_amount: number;
  actual_amount: number;
  difference_amount: number;
}

export interface Shift {
  id: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  opening_note?: string;
  closing_note?: string;
  opened_by: { name: string };
  payments?: ShiftPayment[];
}

export function useShifts() {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/shifts");
      return data.data as Shift[];
    },
  });
}

export function useActiveShift() {
  return useQuery({
    queryKey: ["active-shift"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/shifts/active");
      return data.active_shift as Shift | null;
    },
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/api/v1/shifts/open");
      return data;
    },
    onSuccess: () => {
      toast.success("Смена открыта");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
    },
    onError: (error: unknown) => {
      let msg = "Ошибка при открытии";
      if (isAxiosError(error)) msg = error.response?.data?.message || msg;
      toast.error(msg);
    }
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { actual_cash: number, actual_card: number, closing_note?: string } }) => {
      const res = await api.post(`/api/v1/shifts/${id}/close`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Смена закрыта");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
    },
    onError: (error: unknown) => {
      let msg = "Ошибка при закрытии";
      if (isAxiosError(error)) msg = error.response?.data?.message || msg;
      toast.error(msg);
    }
  });
}