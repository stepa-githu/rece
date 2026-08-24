import { PageHeader } from "@/components/ui";
import { ToneForm } from "@/components/tone-form";
import { requireHotelContext } from "@/lib/auth";
import { getToneProfile } from "@/lib/data";

export const metadata = { title: "Tono di voce" };
export default async function TonePage() {
  const context = await requireHotelContext(); const tone = await getToneProfile(context.hotel.id);
  return <div className="space-y-6"><PageHeader eyebrow="Identità" title="Il tono di voce della struttura" description="Definisci poche regole chiare. Rece le applicherà a ogni bozza, adattandosi comunque alla lingua e al contenuto dell’ospite." /><ToneForm demo={context.demo} initial={tone} /></div>;
}
