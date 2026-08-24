import Link from "next/link";
import { Icon } from "@/components/icons";
import { ReviewRow } from "@/components/review-row";
import { PageHeader, StatCard } from "@/components/ui";
import { requireContext } from "@/lib/auth";
import { getDashboardData, getIntegrations } from "@/lib/data";

export const metadata = { title: "Panoramica" };

export default async function DashboardPage() {
  const context = await requireContext(); const hotelId = context.hotel?.id; if (!hotelId) return null;
  const [{ reviews, stats }, integrations] = await Promise.all([getDashboardData(hotelId), getIntegrations(hotelId)]);
  const activeProviders = integrations.filter((item) => item.status === "connected").length;
  return <div className="space-y-7">
    <PageHeader eyebrow="Oggi" title={`Ciao ${context.profile.full_name.split(" ")[0] || ""}, ecco cosa richiede attenzione`} description={`${context.hotel?.name} · ${activeProviders} fonti collegate`} action={<Link className="button-secondary" href="/reviews"><Icon name="reviews" size={17} /> Tutte le recensioni</Link>} />
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><StatCard label="Da gestire" value={String(stats.needsReply)} detail="recensioni senza bozza" tone="brand" /><StatCard label="Voto medio" value={stats.average.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} detail="normalizzato su 5" tone="sage" /><StatCard label="Bozze pronte" value={String(stats.drafted)} detail="da controllare e copiare" /><StatCard label="Recensioni" value={String(stats.total)} detail="nel pannello" /></section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,.7fr)]">
      <div className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#e7e7df] px-4 py-4 sm:px-5"><div><h2 className="font-extrabold">Recensioni recenti</h2><p className="mt-0.5 text-xs text-[#89928d]">Parti da quelle ancora da gestire</p></div><Link className="text-sm font-bold text-[#d65f49] hover:underline" href="/reviews?status=new">Vedi da gestire</Link></div>{reviews.map((review) => <ReviewRow compact key={review.id} review={review} />)}</div>
      <aside className="space-y-5"><div className="panel overflow-hidden bg-[#17211d] p-5 text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#f09b8a]"><Icon name="sparkles" /></span><h2 className="mt-5 text-xl font-black tracking-[-0.025em]">L’AI è tanto brava quanto ciò che conosce.</h2><p className="mt-2 text-sm leading-6 text-white/62">Aggiungi servizi, FAQ e stile della struttura per ottenere risposte precise, senza frasi generiche.</p><Link className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#f3a495]" href="/knowledge">Migliora la conoscenza <Icon name="arrow" size={17} /></Link></div><div className="panel p-5"><h2 className="font-extrabold">Stato collegamenti</h2><div className="mt-4 space-y-3">{integrations.map((item) => <div className="flex items-center gap-3" key={item.provider}><span className={`h-2.5 w-2.5 rounded-full ${item.status === "connected" ? "bg-[#48a384]" : "bg-[#d6d8d3]"}`} /><span className="flex-1 text-sm font-bold capitalize">{item.provider === "booking" ? "Booking.com" : item.provider}</span><span className="text-xs text-[#89928d]">{item.status === "connected" ? "Attivo" : "Da collegare"}</span></div>)}</div><Link className="button-ghost mt-4 w-full" href="/integrations">Gestisci collegamenti</Link></div></aside>
    </section>
  </div>;
}
