import { Icon, type IconName } from "@/components/icons";
import { IntegrationControls } from "@/components/integration-controls";
import { PageHeader, StatusBadge } from "@/components/ui";
import { requireContext } from "@/lib/auth";
import { getIntegrations } from "@/lib/data";
import type { Integration, ReviewProvider } from "@/types";

const providerCopy: Record<string, { title: string; text: string; icon: IconName; note: string }> = {
  google: { title: "Google Business Profile", text: "Recensioni della scheda verificata, tramite OAuth ufficiale.", icon: "globe", note: "Connessione diretta disponibile" },
  booking: { title: "Booking.com", text: "Guest Review API per uso interno della struttura.", icon: "hotel", note: "Richiede account Connectivity e permesso review-api" },
  tripadvisor: { title: "Tripadvisor Terra", text: "Recensioni associate alla Location autorizzata.", icon: "reviews", note: "Richiede contratto/API key Terra" },
};

function fallback(provider: ReviewProvider, hotelId: string): Integration { return { id: `missing-${provider}`, hotel_id: hotelId, provider, status: "disconnected", external_account_id: null, external_location_id: null, external_location_name: null, available_locations: [], last_synced_at: null, last_error: null }; }

export const metadata = { title: "Collegamenti" };
export default async function IntegrationsPage() {
  const context = await requireContext(); if (!context.hotel) return null; const rows = await getIntegrations(context.hotel.id); const integrations = (["google", "booking", "tripadvisor"] as ReviewProvider[]).map((provider) => rows.find((row) => row.provider === provider) || fallback(provider, context.hotel!.id));
  return <div className="space-y-6"><PageHeader eyebrow="Solo lettura" title="Collega le fonti delle recensioni" description="Rece importa e organizza le recensioni, ma in questa prima versione non pubblica né modifica nulla sulle piattaforme originali." /><div className="rounded-2xl border border-[#d7e9e1] bg-[#eef7f3] px-4 py-3 text-sm leading-6 text-[#315e50]"><strong>Scelta di sicurezza:</strong> ogni risposta resta una bozza finché non la controlli e la copi manualmente.</div><section className="grid gap-4 lg:grid-cols-3">{integrations.map((integration) => { const copy = providerCopy[integration.provider]; return <article className="panel flex min-h-[330px] flex-col p-5" key={integration.provider}><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f2f2ed] text-[#46514b]"><Icon name={copy.icon} /></span><StatusBadge status={integration.status} /></div><h2 className="mt-5 text-lg font-black">{copy.title}</h2><p className="mt-2 text-sm leading-6 text-[#68746e]">{copy.text}</p><p className="mt-3 text-xs font-bold text-[#89928d]">{copy.note}</p>{integration.external_location_name && <div className="mt-4 rounded-xl bg-[#f7f6f1] p-3"><p className="text-xs font-bold text-[#89928d]">Sede collegata</p><p className="mt-1 truncate text-sm font-extrabold">{integration.external_location_name}</p></div>}<div className="mt-auto pt-5"><IntegrationControls demo={context.demo} integration={integration} />{integration.last_synced_at && <p className="mt-3 text-[11px] text-[#89928d]">Ultima sincronizzazione: {new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(integration.last_synced_at))}</p>}{integration.last_error && <p className="mt-2 text-xs text-red-600">{integration.last_error}</p>}</div></article>; })}</section></div>;
}
