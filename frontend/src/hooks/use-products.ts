import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: { id: number; name: string } | null;
  unit: { id: number; name: string; code: string } | null;
  minimum_stock: number;
  total_stock: number;
}

export interface ProductsResponse {
  data: Product[];
  current_page: number;
  last_page: number;
  total: number;
}

export function useProducts(search: string = "", categoryId: number | null = null) {
  return useQuery({
    queryKey: ["products", search, categoryId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryId) params.category_id = categoryId.toString();

      const { data } = await api.get<ProductsResponse>("/api/v1/products", { params });
      return data;
    },
  });
}