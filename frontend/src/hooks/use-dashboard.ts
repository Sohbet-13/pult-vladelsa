import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";

export interface DashboardData {
  kpi: {
    revenue: { value: number; change: number; previous: number };
    stock: { value: number; low_stock: number };
    write_offs: { value: number; change: number; previous: number };
    shifts: { closed: number; total: number; open: number };
  };
  revenue_chart: { date: string; revenue: number; expenses: number }[];
  expense_structure: { name: string; value: number; amount: number }[];
  recent_operations: { id: number; type: string; date: string; item: string; user: string }[];
  alerts: { id: number; type: string; title: string; desc: string; time: string }[];
}

export function useDashboard() {
  const router = useRouter();

  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        const { data } = await api.get<DashboardData>("/api/v1/dashboard");
        return data;
      } catch (error) {
        // Если ошибка 401 (не авторизован) - кидаем на страницу логина
        if (isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
        throw error;
      }
    },
    retry: false, // Отключаем повторные попытки при 401
  });
}