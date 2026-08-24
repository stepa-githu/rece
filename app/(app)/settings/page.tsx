import { HotelSettingsForm } from "@/components/hotel-settings-form";
import { PageHeader } from "@/components/ui";
import { requireHotelContext } from "@/lib/auth";

export const metadata = { title: "Struttura" };
export default async function SettingsPage() {
  const context = await requireHotelContext();
  return <div className="space-y-6"><PageHeader eyebrow="Configurazione" title="Dati della struttura" description="Questi dati identificano l’hotel e aiutano Rece a dare il contesto corretto alle risposte." /><HotelSettingsForm demo={context.demo} hotel={context.hotel} /></div>;
}
