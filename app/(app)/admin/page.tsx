import { AdminManager } from "@/components/admin-manager";
import { PageHeader, StatCard } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAdminData } from "@/lib/data";
import type { Hotel, Profile } from "@/types";

export const metadata = { title: "Backoffice" };
export default async function AdminPage() {
  const context = await requireAdmin(); const { hotels, profiles } = await getAdminData();
  return <div className="space-y-6"><PageHeader eyebrow="Backoffice Rece" title="Hotel e utenti" description="Crea una struttura, poi invita le persone che potranno lavorare sulle sue recensioni." /><div className="grid grid-cols-2 gap-3 lg:max-w-xl"><StatCard label="Strutture" value={String(hotels.length)} detail="spazi configurati" /><StatCard label="Utenti" value={String(profiles.length)} detail="account complessivi" tone="sage" /></div><AdminManager demo={context.demo} hotels={hotels as Hotel[]} profiles={profiles as Profile[]} /></div>;
}
