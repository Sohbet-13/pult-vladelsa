"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Clock,
  ArrowLeftRight,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Главная", href: "/", icon: LayoutDashboard },
  { name: "Товары и остатки", href: "/products", icon: Package },
  { name: "Смены", href: "/shifts", icon: Clock },
  { name: "Операции", href: "/operations", icon: ArrowLeftRight },
  { name: "Аналитика и отчёты", href: "/reports", icon: BarChart3 },
  { name: "Управление", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[260px] bg-[#0E1014] border-r border-white/[0.06] text-text-primary h-screen flex-col fixed left-0 top-0 z-40">
      {/* Логотип */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center shadow-[0_2px_8px_rgba(167,139,250,0.3)]">
            <span className="text-black font-bold text-base">П</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-text-primary">
              Пульт владельца
            </h1>
            <p className="text-[10px] text-text-tertiary">
              Учёт смен и остатков
            </p>
          </div>
        </Link>
      </div>

      {/* Навигация */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-white/[0.06] text-text-primary"
                  : "text-text-secondary hover:bg-white/[0.03] hover:text-text-primary"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-gradient-accent" />
              )}
              <item.icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-accent-from" : "text-text-tertiary"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Профиль пользователя */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-black text-xs font-semibold shrink-0">
            ИП
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-text-primary">
              Иван Петров
            </p>
            <p className="text-[11px] text-text-tertiary truncate">Владелец</p>
          </div>
        </div>
      </div>
    </aside>
  );
}