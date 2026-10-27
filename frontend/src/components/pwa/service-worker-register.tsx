"use client";

import { useEffect } from "react";

/**
 * Регистрирует /sw.js.
 * В dev не регистрируем — иначе HMR и Turbopack кэшируются и начинается боль.
 * Проверка PWA: npm run build && npm start
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((error) => {
          console.error("[PWA] Ошибка регистрации Service Worker:", error);
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}