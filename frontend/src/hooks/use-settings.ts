import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { isAxiosError } from "axios";

export interface OrganizationSettings {
  id: number;
  name: string;
  currency: string;
  timezone: string;
  status: string;
}

export interface LocationItem {
  id: number;
  name: string;
  address: string | null;
  status: "active" | "closed";
}

export interface MemberItem {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: "owner" | "manager" | "employee";
  status: "active" | "inactive";
}

export interface CategoryItem {
  id: number;
  name: string;
  status: "active" | "archived";
}

export interface ReasonItem {
  id: number;
  type: "write_off" | "receipt" | "adjustment";
  name: string;
  requires_comment: boolean;
  status: "active" | "archived";
}

export interface UnitItem {
  id: number;
  code: string;
  name: string;
  decimal_places: number;
}

export interface SettingsData {
  organization: OrganizationSettings | null;
  locations: LocationItem[];
  members: MemberItem[];
  categories: CategoryItem[];
  reasons: ReasonItem[];
  units: UnitItem[];
  meta: {
    current_user_role: "owner" | "manager" | "employee";
    can_edit: boolean;
    can_edit_org: boolean;
  };
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get<SettingsData>("/api/v1/settings");
      return data;
    },
  });
}

function handleErr(error: unknown, fallback: string) {
  let msg = fallback;
  if (isAxiosError(error)) {
    msg = error.response?.data?.message || msg;
  }
  toast.error(msg);
}

// ---- organization ----

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; currency: string; timezone: string }) => {
      const { data } = await api.put("/api/v1/settings/organization", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Организация обновлена");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => handleErr(e, "Ошибка обновления организации"),
  });
}

// ---- locations ----

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; address?: string }) => {
      const { data } = await api.post("/api/v1/settings/locations", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Точка добавлена");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => handleErr(e, "Ошибка создания точки"),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: { name: string; address?: string; status: "active" | "closed" };
    }) => {
      const { data } = await api.put(`/api/v1/settings/locations/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Точка обновлена");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => handleErr(e, "Ошибка обновления точки"),
  });
}

export function useCloseLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/api/v1/settings/locations/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Точка закрыта");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => handleErr(e, "Ошибка закрытия точки"),
  });
}

// ---- members ----

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
      role: "owner" | "manager" | "employee";
    }) => {
      const { data } = await api.post("/api/v1/settings/members", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Сотрудник добавлен");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => handleErr(e, "Ошибка создания сотрудника"),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: number;
      payload: { name: string; role: "owner" | "manager" | "employee"; status: "active" | "inactive" };
    }) => {
      const { data } = await api.put(`/api/v1/settings/members/${userId}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Сотрудник обновлён");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => handleErr(e, "Ошибка обновления сотрудника"),
  });
}

export function useDeactivateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.delete(`/api/v1/settings/members/${userId}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Сотрудник деактивирован");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => handleErr(e, "Ошибка деактивации"),
  });
}

// ---- categories ----

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await api.post("/api/v1/settings/categories", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Категория добавлена");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => handleErr(e, "Ошибка создания категории"),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: { name: string; status: "active" | "archived" };
    }) => {
      const { data } = await api.put(`/api/v1/settings/categories/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Категория обновлена");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => handleErr(e, "Ошибка обновления категории"),
  });
}

// ---- reasons ----

export function useCreateReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      type: "write_off" | "receipt" | "adjustment";
      name: string;
      requires_comment: boolean;
    }) => {
      const { data } = await api.post("/api/v1/settings/reasons", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Причина добавлена");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["stock-reasons"] });
    },
    onError: (e) => handleErr(e, "Ошибка создания причины"),
  });
}

export function useUpdateReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: { name: string; requires_comment: boolean; status: "active" | "archived" };
    }) => {
      const { data } = await api.put(`/api/v1/settings/reasons/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Причина обновлена");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["stock-reasons"] });
    },
    onError: (e) => handleErr(e, "Ошибка обновления причины"),
  });
}