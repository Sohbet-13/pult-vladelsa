"use client";

import { useState } from "react";
import { useCreateCategory, useUpdateCategory, useCreateReason, useUpdateReason, type CategoryItem, type ReasonItem, type SettingsData } from "@/hooks/use-settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";

type ReasonType = "write_off" | "receipt" | "adjustment";
function isReasonType(v: unknown): v is ReasonType { return v === "write_off" || v === "receipt" || v === "adjustment"; }

export function ReferencesSection({ data }: { data: SettingsData }) {
  const canEdit = data.meta.can_edit;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const createReason = useCreateReason();
  const updateReason = useUpdateReason();

  const [catOpen, setCatOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState("");

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonEditing, setReasonEditing] = useState<ReasonItem | null>(null);
  const [rName, setRName] = useState("");
  const [rType, setRType] = useState<ReasonType>("write_off");
  const [rRequiresComment, setRRequiresComment] = useState(false);

  const openCategoryCreate = () => { setCatEditing(null); setCatName(""); setCatOpen(true); };
  const openCategoryEdit = (c: CategoryItem) => { setCatEditing(c); setCatName(c.name); setCatOpen(true); };

  const openReasonCreate = (type: "write_off" | "receipt") => { setReasonEditing(null); setRName(""); setRType(type); setRRequiresComment(false); setReasonOpen(true); };
  const openReasonEdit = (r: ReasonItem) => { setReasonEditing(r); setRName(r.name); setRType(r.type); setRRequiresComment(r.requires_comment); setReasonOpen(true); };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (catEditing) { updateCategory.mutate({ id: catEditing.id, payload: { name: catName, status: catEditing.status } }, { onSuccess: () => setCatOpen(false) }); } 
    else { createCategory.mutate({ name: catName }, { onSuccess: () => setCatOpen(false) }); }
  };

  const handleReasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reasonEditing) { updateReason.mutate({ id: reasonEditing.id, payload: { name: rName, requires_comment: rRequiresComment, status: reasonEditing.status } }, { onSuccess: () => setReasonOpen(false) }); } 
    else { createReason.mutate({ type: rType, name: rName, requires_comment: rRequiresComment }, { onSuccess: () => setReasonOpen(false) }); }
  };

  const writeOffReasons = data.reasons.filter((r) => r.type === "write_off");
  const receiptReasons = data.reasons.filter((r) => r.type === "receipt");

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Категории товаров</h2>
            <p className="text-sm text-text-secondary">Используются для группировки товаров</p>
          </div>
          {canEdit && (
            <Button onClick={openCategoryCreate} className="gap-1 bg-gradient-accent text-black hover:opacity-90 font-medium" size="sm">
              <Plus className="w-4 h-4" /> Добавить
            </Button>
          )}
        </div>

        {data.categories.length === 0 ? (
          <p className="text-sm text-text-tertiary">Категорий пока нет</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-surface-2">
                <span className="text-sm font-medium text-text-primary">{c.name}</span>
                {c.status === "archived" && <Badge variant="secondary" className="text-[10px] bg-surface-1 text-text-tertiary">Архив</Badge>}
                {canEdit && (
                  <button onClick={() => openCategoryEdit(c)} className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Изменить">
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReasonBlock title="Причины списания" reasons={writeOffReasons} canEdit={canEdit} onAdd={() => openReasonCreate("write_off")} onEdit={openReasonEdit} />
        <ReasonBlock title="Причины прихода" reasons={receiptReasons} canEdit={canEdit} onAdd={() => openReasonCreate("receipt")} onEdit={openReasonEdit} />
      </div>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{catEditing ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name" className="text-text-secondary">Название</Label>
              <Input id="cat-name" value={catName} onChange={(e) => setCatName(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCatOpen(false)} className="border-white/[0.06] bg-transparent text-text-primary hover:bg-surface-2">Отмена</Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending || !catName} className="bg-gradient-accent text-black font-medium hover:opacity-90">{catEditing ? "Сохранить" : "Добавить"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{reasonEditing ? "Редактировать причину" : "Новая причина"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReasonSubmit} className="space-y-4 py-4">
            {!reasonEditing && (
              <div className="space-y-2">
                <Label className="text-text-secondary">Тип</Label>
                <Select value={rType} onValueChange={(v) => { if (isReasonType(v)) setRType(v); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="write_off">Списание</SelectItem>
                    <SelectItem value="receipt">Приход</SelectItem>
                    <SelectItem value="adjustment">Корректировка</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="r-name" className="text-text-secondary">Название</Label>
              <Input id="r-name" value={rName} onChange={(e) => setRName(e.target.value)} required />
            </div>
            <div className="flex items-center gap-2">
              <input id="r-req" type="checkbox" checked={rRequiresComment} onChange={(e) => setRRequiresComment(e.target.checked)} className="w-4 h-4 rounded border-white/[0.06] bg-surface-2 text-primary focus:ring-primary focus:ring-offset-surface-1" />
              <Label htmlFor="r-req" className="cursor-pointer text-text-secondary">Требует комментарий</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReasonOpen(false)} className="border-white/[0.06] bg-transparent text-text-primary hover:bg-surface-2">Отмена</Button>
              <Button type="submit" disabled={createReason.isPending || updateReason.isPending || !rName} className="bg-gradient-accent text-black font-medium hover:opacity-90">{reasonEditing ? "Сохранить" : "Добавить"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReasonBlock({ title, reasons, canEdit, onAdd, onEdit }: { title: string; reasons: ReasonItem[]; canEdit: boolean; onAdd: () => void; onEdit: (r: ReasonItem) => void; }) {
  return (
    <Card className="p-6 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {canEdit && (
          <Button onClick={onAdd} size="sm" variant="outline" className="gap-1 border-white/[0.06] bg-surface-2 text-text-primary hover:bg-surface-3">
            <Plus className="w-3.5 h-3.5" /> Добавить
          </Button>
        )}
      </div>
      {reasons.length === 0 ? (
        <p className="text-sm text-text-tertiary">Пока нет причин</p>
      ) : (
        <ul className="space-y-1">
          {reasons.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-md hover:bg-white/[0.03] transition-colors">
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-sm truncate text-text-primary">{r.name}</span>
                {r.requires_comment && <Badge variant="outline" className="text-[10px] border-white/[0.06] text-text-tertiary">комментарий</Badge>}
                {r.status === "archived" && <Badge variant="secondary" className="text-[10px] bg-surface-2 text-text-tertiary">Архив</Badge>}
              </div>
              {canEdit && (
                <button onClick={() => onEdit(r)} className="text-text-tertiary hover:text-text-primary transition-colors shrink-0" aria-label="Изменить">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}