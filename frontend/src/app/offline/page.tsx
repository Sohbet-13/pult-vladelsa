import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Нет соединения — Пульт владельца",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-1 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <WifiOff className="h-8 w-8 text-text-tertiary" />
      </div>
      <h1 className="mt-6 text-xl font-semibold text-text-primary">
        Нет соединения
      </h1>
      <p className="mt-2 max-w-xs text-sm text-text-secondary">
        Проверь интернет — данные обновятся автоматически, как только связь
        восстановится.
      </p>
    </main>
  );
}