"use client";

import { animate } from "framer-motion";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number;
  suffix?: string;
  change?: number;
  icon: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function KpiCard({
  title,
  value,
  suffix = "",
  change,
  icon,
  subtitle,
}: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <Card className="relative p-5 bg-surface-1 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:ring-white/[0.10] transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5 min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
            {title}
          </p>
          <h3 className="text-[32px] leading-none font-semibold tracking-tight tabular-nums text-text-primary">
            {displayValue.toLocaleString("ru-RU")}
            {suffix && (
              <span className="text-sm font-medium text-text-tertiary ml-1.5">
                {suffix}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1.5 min-h-[18px] flex-wrap">
            {change !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  change >= 0 ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-text-tertiary">{subtitle}</span>
            )}
          </div>
        </div>
        <div className="text-text-tertiary opacity-40 group-hover:opacity-70 transition-opacity shrink-0">
          {icon}
        </div>
      </div>
    </Card>
  );
}