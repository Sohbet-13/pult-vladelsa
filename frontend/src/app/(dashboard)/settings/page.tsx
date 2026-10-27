"use client";

import { useSettings } from "@/hooks/use-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { OrganizationSection } from "./_components/organization-section";
import { LocationsSection } from "./_components/locations-section";
import { TeamSection } from "./_components/team-section";
import { ReferencesSection } from "./_components/references-section";

export default function SettingsPage() {
  const { data, isLoading } = useSettings();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px] bg-surface-2" />
        <Skeleton className="h-10 w-[500px] bg-surface-2" />
        <Skeleton className="h-[300px] rounded-xl bg-surface-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Управление</h1>
        <p className="text-text-secondary mt-1">Настройки организации, точки, сотрудники и справочники</p>
      </div>

      {!data.meta.can_edit && (
        <Card className="p-4 border-amber-500/20 bg-amber-500/10 text-amber-400 text-sm">
          Ваша роль — «Сотрудник». Раздел доступен только для просмотра.
        </Card>
      )}

      <Tabs defaultValue="organization" className="gap-4">
        <TabsList className="bg-surface-2 border-white/[0.06] p-1 rounded-lg">
          <TabsTrigger value="organization" className="data-active:bg-surface-1 data-active:text-text-primary data-active:shadow-sm rounded-md px-4 py-1.5 text-text-secondary">Организация</TabsTrigger>
          <TabsTrigger value="locations" className="data-active:bg-surface-1 data-active:text-text-primary data-active:shadow-sm rounded-md px-4 py-1.5 text-text-secondary">Точки</TabsTrigger>
          <TabsTrigger value="team" className="data-active:bg-surface-1 data-active:text-text-primary data-active:shadow-sm rounded-md px-4 py-1.5 text-text-secondary">Сотрудники</TabsTrigger>
          <TabsTrigger value="references" className="data-active:bg-surface-1 data-active:text-text-primary data-active:shadow-sm rounded-md px-4 py-1.5 text-text-secondary">Справочники</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <OrganizationSection data={data} />
        </TabsContent>
        <TabsContent value="locations">
          <LocationsSection data={data} />
        </TabsContent>
        <TabsContent value="team">
          <TeamSection data={data} />
        </TabsContent>
        <TabsContent value="references">
          <ReferencesSection data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}