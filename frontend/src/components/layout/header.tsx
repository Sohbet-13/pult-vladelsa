"use client";

import { Bell, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="h-16 bg-background/60 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <div className="flex items-center gap-2 bg-surface-2 hover:bg-surface-3 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ring-1 ring-white/[0.06]">
          <MapPin className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-text-primary">Кафе «Вкусный день»</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-sm text-text-secondary bg-surface-2 px-3 py-1.5 rounded-lg ring-1 ring-white/[0.06]">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>14 апреля 2025</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-text-secondary hover:text-text-primary hover:bg-surface-3"
        >
          <Bell className="w-4 h-4" />
          <Badge className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[10px] bg-gradient-accent text-black border-0 font-semibold">
            3
          </Badge>
        </Button>

        <div className="w-9 h-9 rounded-full bg-gradient-accent text-black flex items-center justify-center text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity">
          ИП
        </div>
      </div>
    </header>
  );
}