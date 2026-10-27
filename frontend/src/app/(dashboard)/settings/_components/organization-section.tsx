"use client";

import { useState } from "react";
import { useUpdateOrganization, type OrganizationSettings, type SettingsData } from "@/hooks/use-settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENCIES = ["RUB", "USD", "EUR", "KZT", "BYN", "UAH", "GEL", "AMD", "KGS", "UZS"];

export function OrganizationSection({ data }: { data: SettingsData }) {
  const org = data.organization;
  const canEdit = data.meta.can_edit_org;
  const formKey = org ? `${org.id}:${org.name}:${org.currency}:${org.timezone}` : "empty";

  return (
    <Card className="p-6 bg-surface-1 border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="max-w-xl space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Данные организации</h2>
          <p className="text-sm text-text-secondary">Название, валюта и часовой пояс бизнеса</p>
        </div>

        {org ? <OrganizationForm key={formKey} org={org} canEdit={canEdit} /> : <p className="text-sm text-text-secondary">Организация не найдена.</p>}
      </div>
    </Card>
  );
}

function OrganizationForm({ org, canEdit }: { org: OrganizationSettings; canEdit: boolean; }) {
  const mutation = useUpdateOrganization();
  const [name, setName] = useState(org.name);
  const [currency, setCurrency] = useState(org.currency);
  const [timezone, setTimezone] = useState(org.timezone);

  const isDirty = name !== org.name || currency !== org.currency || timezone !== org.timezone;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, currency, timezone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name" className="text-text-secondary">Название</Label>
        <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit || mutation.isPending} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-text-secondary">Валюта</Label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)} disabled={!canEdit || mutation.isPending}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-tz" className="text-text-secondary">Часовой пояс</Label>
          <Input id="org-tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={!canEdit || mutation.isPending} placeholder="Europe/Moscow" required />
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || mutation.isPending} className="bg-gradient-accent text-black hover:opacity-90 font-medium">
            {mutation.isPending ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>
      )}
    </form>
  );
}