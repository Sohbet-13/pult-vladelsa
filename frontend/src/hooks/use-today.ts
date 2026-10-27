import { useSyncExternalStore } from "react";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Кэш на 60 секунд — чтобы getSnapshot возвращал стабильное значение
// между вызовами React (защита от ре-рендеров на границе суток).
let cached: string | null = null;
let cachedAt = 0;
const TTL_MS = 60_000;

function getSnapshot(): string {
  const now = Date.now();
  if (cached === null || now - cachedAt > TTL_MS) {
    cached = todayISO();
    cachedAt = now;
  }
  return cached;
}

// Не подписываемся ни на что — системные часы «постоянны» для наших целей.
const subscribe = () => () => {};

// На сервере/prerender возвращаем пустую строку —
// чтобы не читать время во время сборки (cacheComponents Next 16).
const getServerSnapshot = () => "";

/**
 * Возвращает локальную дату YYYY-MM-DD.
 * - на SSR/prerender: ""
 * - после hydration: актуальная дата
 */
export function useToday(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Возвращает дату на N дней раньше указанной (YYYY-MM-DD).
 * Если iso пустой — возвращает "".
 */
export function daysBefore(iso: string, n: number): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}