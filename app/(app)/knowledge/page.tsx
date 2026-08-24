import { Icon } from "@/components/icons";
import { KnowledgeManager } from "@/components/knowledge-manager";
import { PageHeader, StatusBadge } from "@/components/ui";
import { requireContext } from "@/lib/auth";
import { getKnowledgeSources } from "@/lib/data";

export const metadata = { title: "Conoscenza AI" };

export default async function KnowledgePage() {
  const context = await requireContext(); if (!context.hotel) return null; const sources = await getKnowledgeSources(context.hotel.id);
  return <div className="space-y-6"><PageHeader eyebrow="Contesto" title="Cosa deve sapere Rece" description="Queste informazioni vengono usate per preparare risposte accurate. Non servono addestramenti tecnici: basta tenere le fonti aggiornate." /><div className="grid items-start gap-5 xl:grid-cols-[minmax(330px,.8fr)_minmax(0,1.2fr)]"><KnowledgeManager defaultUrl={context.hotel.official_site_url || ""} demo={context.demo} /><section className="panel overflow-hidden"><div className="border-b border-[#e7e7df] px-5 py-4"><h2 className="font-extrabold">Fonti acquisite</h2><p className="mt-1 text-xs text-[#89928d]">{sources.length} fonti disponibili per le risposte</p></div>{sources.length ? <div>{sources.map((source) => <article className="flex items-start gap-3 border-b border-[#ecece5] p-4 last:border-0 sm:p-5" key={source.id}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f2f2ed] text-[#68746e]"><Icon name={source.source_type === "website" ? "globe" : "file"} size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-extrabold">{source.title}</h3><StatusBadge status={source.status} /></div><p className="mt-1 truncate text-xs text-[#89928d]">{source.source_url || source.file_name || "Nota interna"}</p><p className="mt-2 text-xs font-bold text-[#68746e]">{source.character_count.toLocaleString("it-IT")} caratteri · aggiornato {new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(new Date(source.updated_at))}</p></div></article>)}</div> : <p className="p-8 text-center text-sm text-[#89928d]">Non hai ancora aggiunto fonti.</p>}</section></div></div>;
}
