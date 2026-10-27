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
import { useStockReasons, useWriteOff } from "@/hooks/use-stock";
import { Product } from "@/hooks/use-products";

interface WriteOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function WriteOffDialog({
  open,
  onOpenChange,
  product,
}: WriteOffDialogProps) {
  const { data: reasons, isLoading: reasonsLoading } = useStockReasons();
  const writeOffMutation = useWriteOff();

  const [quantity, setQuantity] = useState<string>("");
  const [reasonId, setReasonId] = useState<string>("");
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !quantity || !reasonId) return;

    writeOffMutation.mutate(
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

  const maxStock = product.total_stock > 0 ? product.total_stock : 0;
  const isOverLimit = parseFloat(quantity) > maxStock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Списание товара</DialogTitle>
          <DialogDescription>
            {product.name} · остаток {product.total_stock}{" "}
            {product.unit?.code === "pcs" ? "шт" : product.unit?.code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-text-secondary">
              Количество к списанию
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.001"
              min="0.001"
              max={maxStock}
              placeholder={`Максимум: ${maxStock}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            {isOverLimit && (
              <p className="text-xs text-rose-400">
                Нельзя списать больше, чем есть на складе
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-text-secondary">Причина списания</Label>
            <Select
              value={reasonId}
              onValueChange={(value) => setReasonId(value ?? "")}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите причину" />
              </SelectTrigger>
              <SelectContent>
                {reasonsLoading ? (
                  <SelectItem value="loading" disabled>
                    Загрузка...
                  </SelectItem>
                ) : (
                  reasons?.map((reason) => (
                    <SelectItem key={reason.id} value={reason.id.toString()}>
                      {reason.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
              disabled={
                writeOffMutation.isPending || !quantity || !reasonId || isOverLimit
              }
            >
              {writeOffMutation.isPending ? "Списание..." : "Списать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}