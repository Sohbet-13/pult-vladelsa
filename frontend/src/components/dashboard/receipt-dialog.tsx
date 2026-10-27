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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStockReasons, useReceipt } from "@/hooks/use-stock";
import { Product } from "@/hooks/use-products";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ReceiptDialog({
  open,
  onOpenChange,
  product,
}: ReceiptDialogProps) {
  const { data: reasons, isLoading: reasonsLoading } = useStockReasons("receipt");
  const receiptMutation = useReceipt();

  const [quantity, setQuantity] = useState<string>("");
  const [reasonId, setReasonId] = useState<string>("");
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !quantity || !reasonId) return;

    receiptMutation.mutate(
      {
        product_id: product.id,
        location_id: 1,
        quantity: parseFloat(quantity),
        reason_id: parseInt(reasonId),
        comment: comment || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setQuantity("");
          setReasonId("");
          setComment("");
        },
      }
    );
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Приход товара</DialogTitle>
          <DialogDescription>
            {product.name} · остаток {product.total_stock}{" "}
            {product.unit?.code === "pcs" ? "шт" : product.unit?.code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-text-secondary">
              Количество к приходу
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.001"
              min="0.001"
              placeholder="Например: 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-text-secondary">Причина прихода</Label>
            <Select
              value={reasonId}
              onValueChange={(value) => setReasonId(value ?? "")}
              required
              disabled={reasonsLoading || !reasons || reasons.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    reasonsLoading
                      ? "Загрузка..."
                      : !reasons || reasons.length === 0
                        ? "Нет доступных причин"
                        : "Выберите причину"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {reasonsLoading ? (
                  <SelectItem value="loading" disabled>
                    Загрузка...
                  </SelectItem>
                ) : !reasons || reasons.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Причины не найдены в БД
                  </SelectItem>
                ) : (
                  reasons.map((reason) => (
                    <SelectItem key={reason.id} value={reason.id.toString()}>
                      {reason.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!reasonsLoading && (!reasons || reasons.length === 0) && (
              <p className="text-xs text-rose-400">
                Запустите на бэкенде:{" "}
                <code className="bg-surface-2 px-1 py-0.5 rounded text-text-primary">
                  php artisan db:seed --class=StockReasonSeeder
                </code>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-text-secondary">
              Комментарий (опционально)
            </Label>
            <Textarea
              id="comment"
              placeholder="Укажите детали, если необходимо..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
            />
          </div>

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
              disabled={receiptMutation.isPending || !quantity || !reasonId}
            >
              {receiptMutation.isPending ? "Оформление..." : "Оформить приход"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}