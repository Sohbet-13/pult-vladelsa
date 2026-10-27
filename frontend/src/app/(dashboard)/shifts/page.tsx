"use client";

import { useState } from "react";
import { useShifts, useActiveShift, useOpenShift, Shift } from "@/hooks/use-shifts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Play, Lock } from "lucide-react";
import { CloseShiftDialog } from "@/components/dashboard/close-shift-dialog";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function ShiftsPage() {
  const { data: shifts, isLoading } = useShifts();
  const { data: activeShift } = useActiveShift();
  const openMutation = useOpenShift();
  
  const [closeOpen, setCloseOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const handleCloseClick = (shift: Shift) => {
    setSelectedShift(shift);
    setCloseOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Смены</h1>
          <p className="text-text-secondary mt-1">Открытие и закрытие рабочего дня</p>
        </div>
        <div>
          {!activeShift && (
            <Button className="gap-2 bg-gradient-accent text-black hover:opacity-90" onClick={() => openMutation.mutate()} disabled={openMutation.isPending}>
              <Play className="w-4 h-4" /> Открыть смену
            </Button>
          )}
          {activeShift && (
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm">
              <Clock className="w-4 h-4 mr-2" /> Смена открыта
            </Badge>
          )}
        </div>
      </div>

      <Card className="bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full bg-surface-2" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Смена</TableHead>
                <TableHead>Открыта</TableHead>
                <TableHead>Сотрудник</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts?.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium text-text-primary">#{shift.id}</TableCell>
                  <TableCell className="text-text-secondary">{formatDate(shift.opened_at)}</TableCell>
                  <TableCell className="text-text-secondary">{shift.opened_by?.name}</TableCell>
                  <TableCell>
                    {shift.status === 'open' ? (
                      <Badge variant="outline" className="text-blue-400 border-blue-500/20 bg-blue-500/10">Открыта</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-surface-2 text-text-secondary border-white/[0.06]">Закрыта</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {shift.status === 'open' && (
                      <Button variant="outline" size="sm" className="gap-1 border-white/[0.06] bg-surface-2 text-text-primary hover:bg-surface-3" onClick={() => handleCloseClick(shift)}>
                        <Lock className="w-3.5 h-3.5" /> Закрыть
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!shifts || shifts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-text-tertiary">
                    Смен пока нет
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <CloseShiftDialog open={closeOpen} onOpenChange={setCloseOpen} shift={selectedShift} />
    </div>
  );
}