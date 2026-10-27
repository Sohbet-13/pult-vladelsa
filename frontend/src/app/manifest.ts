import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Пульт владельца",
    short_name: "Пульт",
    description: "Мобильный пульт владельца: KPI, товары, смены и операции.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121418",
    theme_color: "#121418",
    lang: "ru",
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Смены", short_name: "Смены", url: "/shifts" },
      { name: "Товары", short_name: "Товары", url: "/products" },
      { name: "Операции", short_name: "Операции", url: "/operations" },
    ],
  };
}