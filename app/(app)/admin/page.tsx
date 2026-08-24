import { AdminManager } from "@/components/admin-manager";
import { PageHeader, StatCard } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/auth";
import { getAdminData } from "@/lib/data";
import type { Hotel, Profile } from "@/types";

export const metadata = { title: "Backoffice" };
export default async function AdminPage() {
  const context = await requirePlatformAdmin(); const { hotels, profiles } = await getAdminData();
  const hotelUsers = profiles.filter((profile) => profile.role === "hotel_user");
  return <div className="space-y-6"><PageHeader eyebrow="Centro clienti Rece" title="Strutture ricettive" description="Crea un nuovo spazio cliente e invia l’accesso al suo referente in un unico passaggio." /><div className="grid grid-cols-2 gap-3 lg:max-w-xl"><StatCard label="Strutture" value={String(hotels.length)} detail="clienti configurati" /><StatCard label="Accessi hotel" value={String(hotelUsers.length)} detail="referenti invitati" tone="sage" /></div><AdminManager demo={context.demo} hotels={hotels as Hotel[]} profiles={hotelUsers as Profile[]} /></div>;
}
