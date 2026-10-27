"use client";

import { useState } from "react";
import { useCreateMember, useUpdateMember, useDeactivateMember, type MemberItem, type SettingsData } from "@/hooks/use-settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, UserX } from "lucide-react";

type Role = "owner" | "manager" | "employee";
type MemberStatus = "active" | "inactive";

const ROLE_LABELS: Record<Role, string> = { owner: "Владелец", manager: "Менеджер", employee: "Сотрудник" };

function isRole(v: unknown): v is Role { return v === "owner" || v === "manager" || v === "employee"; }
function isMemberStatus(v: unknown): v is MemberStatus { return v === "active" || v === "inactive"; }

export function TeamSection({ data }: { data: SettingsData }) {
  const canEdit = data.meta.can_edit;
  const canEditOrg = data.meta.can_edit_org;

  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember();
  const deactivateMutation = useDeactivateMember();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<MemberItem | null>(null);

  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cRole, setCRole] = useState<Role>("employee");

  const [eName, setEName] = useState("");
  const [eRole, setERole] = useState<Role>("employee");
  const [eStatus, setEStatus] = useState<MemberStatus>("active");

  const openEdit = (m: MemberItem) => { setEditing(m); setEName(m.name); setERole(m.role); setEStatus(m.status); setEditOpen(true); };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name: cName, email: cEmail, password: cPassword, role: cRole }, {
      onSuccess: () => { setCreateOpen(false); setCName(""); setCEmail(""); setCPassword(""); setCRole("employee"); },
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMutation.mutate({ userId: editing.user_id, payload: { name: eName, role: eRole, status: eStatus } }, { onSuccess: () => setEditOpen(false) });
  };

  return (
    <Card className="bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Сотрудники</h2>
          <p className="text-sm text-text-secondary">{data.members.filter((m) => m.status === "active").length} активных</p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)} className="gap-1 bg-gradient-accent text-black hover:opacity-90 font-medium">
            <Plus className="w-4 h-4" /> Добавить
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Имя</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-[220px] text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.members.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium text-text-primary">{m.name}</TableCell>
              <TableCell className="text-text-tertiary font-mono text-xs">{m.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal border-white/[0.06] bg-surface-2 text-text-secondary">{ROLE_LABELS[m.role] ?? m.role}</Badge>
              </TableCell>
              <TableCell>
                {m.status === "active" ? (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">Активен</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-surface-2 text-text-secondary border-white/[0.06]">Неактивен</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="gap-1 px-2 text-text-secondary hover:text-text-primary hover:bg-white/[0.04]" onClick={() => openEdit(m)}>
                      <Pencil className="w-3.5 h-3.5" /> Изменить
                    </Button>
                    {m.status === "active" && m.user_id !== data.members.find((x) => x.role === "owner")?.user_id && (
                      <Button variant="ghost" size="sm" className="gap-1 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => { if (confirm(`Деактивировать ${m.name}?`)) deactivateMutation.mutate(m.user_id); }} disabled={deactivateMutation.isPending}>
                        <UserX className="w-3.5 h-3.5" /> Отключить
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Новый сотрудник</DialogTitle>
            <DialogDescription>Создайте учётную запись и назначьте роль</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="m-name" className="text-text-secondary">Имя</Label>
              <Input id="m-name" value={cName} onChange={(e) => setCName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-email" className="text-text-secondary">Email</Label>
              <Input id="m-email" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-pass" className="text-text-secondary">Пароль</Label>
              <Input id="m-pass" type="text" value={cPassword} onChange={(e) => setCPassword(e.target.value)} required minLength={6} placeholder="Минимум 6 символов" />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary">Роль</Label>
              <Select value={cRole} onValueChange={(v) => { if (isRole(v)) setCRole(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Сотрудник</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  {canEditOrg && <SelectItem value="owner">Владелец</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="border-white/[0.06] bg-transparent text-text-primary hover:bg-surface-2">Отмена</Button>
              <Button type="submit" disabled={createMutation.isPending || !cName || !cEmail || !cPassword} className="bg-gradient-accent text-black font-medium hover:opacity-90">Добавить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Редактировать сотрудника</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="e-name" className="text-text-secondary">Имя</Label>
              <Input id="e-name" value={eName} onChange={(e) => setEName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary">Роль</Label>
              <Select value={eRole} onValueChange={(v) => { if (isRole(v)) setERole(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Сотрудник</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  {canEditOrg && <SelectItem value="owner">Владелец</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary">Статус</Label>
              <Select value={eStatus} onValueChange={(v) => { if (isMemberStatus(v)) setEStatus(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="inactive">Неактивен</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-white/[0.06] bg-transparent text-text-primary hover:bg-surface-2">Отмена</Button>
              <Button type="submit" disabled={updateMutation.isPending || !eName} className="bg-gradient-accent text-black font-medium hover:opacity-90">Сохранить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}