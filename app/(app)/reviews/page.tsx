import { Icon } from "@/components/icons";
import { ReviewRow } from "@/components/review-row";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireHotelContext } from "@/lib/auth";
import { getReviews } from "@/lib/data";

export const metadata = { title: "Recensioni" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await requireHotelContext(); const params = await searchParams; const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const reviews = await getReviews(context.hotel.id, { provider: value("provider"), status: value("status"), rating: value("rating"), q: value("q") });
  return <div className="space-y-6">
    <PageHeader eyebrow="Reputazione" title="Tutte le recensioni" description="Leggi, filtra e prepara le risposte senza saltare da una piattaforma all’altra." />
    <form className="panel grid gap-3 p-3 sm:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(135px,auto))_auto]" method="get"><label className="relative"><span className="sr-only">Cerca recensioni</span><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d9791]" name="search" size={18} /><input className="field pl-10" defaultValue={value("q")} name="q" placeholder="Cerca ospite o testo…" /></label><select className="field" defaultValue={value("provider")} name="provider" aria-label="Filtra per fonte"><option value="">Tutte le fonti</option><option value="google">Google</option><option value="booking">Booking.com</option><option value="tripadvisor">Tripadvisor</option></select><select className="field" defaultValue={value("status")} name="status" aria-label="Filtra per stato"><option value="">Tutti gli stati</option><option value="new">Da gestire</option><option value="drafted">Bozza pronta</option><option value="handled">Gestita</option><option value="ignored">Ignorata</option></select><select className="field" defaultValue={value("rating")} name="rating" aria-label="Filtra per voto"><option value="">Ogni voto</option><option value="4">Da 4 stelle</option><option value="3">Da 3 stelle</option><option value="1">Con voto</option></select><button className="button-secondary" type="submit"><Icon name="filter" size={17} /> Filtra</button></form>
    {reviews.length ? <div className="panel overflow-hidden"><div className="border-b border-[#e7e7df] px-5 py-3 text-xs font-bold text-[#89928d]">{reviews.length} recensioni</div>{reviews.map((review) => <ReviewRow key={review.id} review={review} />)}</div> : <EmptyState title="Nessuna recensione trovata" text="Prova a cambiare i filtri oppure collega la prima fonte." href="/integrations" action="Vai ai collegamenti" />}
  </div>;
}
