"use client";

import { useState } from "react";
import { useCreateLocation, useUpdateLocation, useCloseLocation, type LocationItem, type SettingsData } from "@/hooks/use-settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Lock } from "lucide-react";

export function LocationsSection({ data }: { data: SettingsData }) {
  const canEdit = data.meta.can_edit;
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const closeMutation = useCloseLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocationItem | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const openCreate = () => { setEditing(null); setName(""); setAddress(""); setDialogOpen(true); };
  const openEdit = (loc: LocationItem) => { setEditing(loc); setName(loc.name); setAddress(loc.address ?? ""); setDialogOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: { name, address: address || undefined, status: editing.status } }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createMutation.mutate({ name, address: address || undefined }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <Card className="bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Точки</h2>
          <p className="text-sm text-text-secondary">{data.locations.filter((l) => l.status === "active").length} активных</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-1 bg-gradient-accent text-black hover:opacity-90 font-medium">
            <Plus className="w-4 h-4" /> Добавить
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Название</TableHead>
            <TableHead>Адрес</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-[180px] text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.locations.map((loc) => (
            <TableRow key={loc.id}>
              <TableCell className="font-medium text-text-primary">{loc.name}</TableCell>
              <TableCell className="text-text-secondary">{loc.address || "—"}</TableCell>
              <TableCell>
                {loc.status === "active" ? (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">Активна</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-surface-2 text-text-secondary border-white/[0.06]">Закрыта</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="gap-1 px-2 text-text-secondary hover:text-text-primary hover:bg-white/[0.04]" onClick={() => openEdit(loc)}>
                      <Pencil className="w-3.5 h-3.5" /> Изменить
                    </Button>
                    {loc.status === "active" && (
                      <Button variant="ghost" size="sm" className="gap-1 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => { if (confirm(`Закрыть точку «${loc.name}»?`)) closeMutation.mutate(loc.id); }} disabled={closeMutation.isPending}>
                        <Lock className="w-3.5 h-3.5" /> Закрыть
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать точку" : "Новая точка"}</DialogTitle>
            <DialogDescription>{editing ? "Измените название и адрес" : "Добавьте новую точку продаж"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="loc-name" className="text-text-secondary">Название</Label>
              <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-address" className="text-text-secondary">Адрес</Label>
              <Input id="loc-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Опционально" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-white/[0.06] bg-transparent text-text-primary hover:bg-surface-2">Отмена</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || !name} className="bg-gradient-accent text-black font-medium hover:opacity-90">{editing ? "Сохранить" : "Добавить"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}