"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCloseShift, Shift } from "@/hooks/use-shifts";

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
}

export function CloseShiftDialog({
  open,
  onOpenChange,
  shift,
}: CloseShiftDialogProps) {
  const closeMutation = useCloseShift();
  const [cash, setCash] = useState("");
  const [card, setCard] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift || !cash || !card) return;

    closeMutation.mutate(
      {
        id: shift.id,
        data: {
          actual_cash: parseFloat(cash),
          actual_card: parseFloat(card),
          closing_note: note || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setCash("");
          setCard("");
          setNote("");
        },
      }
    );
  };

  if (!shift) return null;

  const expCash = 8500;
  const expCard = 15000;

  const cashDiff = cash ? parseFloat(cash) - expCash : 0;
  const cardDiff = card ? parseFloat(card) - expCard : 0;
  const totalDiff = cashDiff + cardDiff;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Закрытие смены #{shift.id}</DialogTitle>
          <DialogDescription>
            Введите фактические суммы из кассы
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-text-secondary">
              Наличные{" "}
              <span className="text-text-tertiary">
                (ожидается {expCash.toLocaleString("ru-RU")} ₽)
              </span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              required
            />
            {cash && cashDiff !== 0 && (
              <p
                className={`text-xs ${
                  cashDiff < 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {cashDiff < 0 ? "Недостача" : "Излишек"}:{" "}
                {Math.abs(cashDiff).toLocaleString("ru-RU")} ₽
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-text-secondary">
              Безналичный расчёт{" "}
              <span className="text-text-tertiary">
                (ожидается {expCard.toLocaleString("ru-RU")} ₽)
              </span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={card}
              onChange={(e) => setCard(e.target.value)}
              required
            />
            {card && cardDiff !== 0 && (
              <p
                className={`text-xs ${
                  cardDiff < 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {cardDiff < 0 ? "Недостача" : "Излишек"}:{" "}
                {Math.abs(cardDiff).toLocaleString("ru-RU")} ₽
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-text-secondary">
              Комментарий (опционально)
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: инкассация в 21:00"
              className="resize-none"
            />
          </div>

          {totalDiff !== 0 && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                totalDiff < 0
                  ? "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              }`}
            >
              Итоговое расхождение: {totalDiff > 0 ? "+" : ""}
              {totalDiff.toLocaleString("ru-RU")} ₽
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={closeMutation.isPending || !cash || !card}
            >
              {closeMutation.isPending ? "Закрытие..." : "Закрыть смену"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}