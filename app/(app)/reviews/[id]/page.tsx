import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftEditor } from "@/components/draft-editor";
import { Icon } from "@/components/icons";
import { ProviderBadge, Rating, StatusBadge } from "@/components/ui";
import { requireContext } from "@/lib/auth";
import { getReview } from "@/lib/data";

export const metadata = { title: "Dettaglio recensione" };

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireContext(); const { id } = await params; if (!context.hotel) notFound();
  const review = await getReview(context.hotel.id, id); if (!review) notFound();
  return <div className="space-y-5"><Link className="inline-flex items-center gap-1.5 text-sm font-bold text-[#68746e] hover:text-[#d65f49]" href="/reviews"><Icon className="rotate-180" name="arrow" size={17} /> Torna alle recensioni</Link>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,.8fr)]">
      <article className="panel overflow-hidden"><div className="border-b border-[#e7e7df] px-5 py-4"><div className="flex flex-wrap items-center gap-2"><ProviderBadge provider={review.provider} /><StatusBadge status={review.workflow_status} /><span className="ml-auto text-xs text-[#89928d]">{new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(new Date(review.review_date))}</span></div></div><div className="p-5 sm:p-7"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#89928d]">Recensione di</p><h1 className="mt-1 text-2xl font-black tracking-[-0.035em]">{review.author_name || "Ospite anonimo"}</h1>{review.author_country && <p className="mt-1 text-xs text-[#89928d]">Paese: {review.author_country}</p>}</div><Rating rating={review.rating} scale={review.rating_scale} /></div>{review.title && <h2 className="mt-7 text-lg font-extrabold">{review.title}</h2>}{review.body && <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#46514b]">{review.body}</p>}{review.positive_text && <div className="mt-6 rounded-2xl bg-[#eef7f3] p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#2f7a64]">Cosa è piaciuto</p><p className="mt-2 text-sm leading-6 text-[#46514b]">{review.positive_text}</p></div>}{review.negative_text && <div className="mt-3 rounded-2xl bg-[#fff3ef] p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#d65f49]">Cosa migliorare</p><p className="mt-2 text-sm leading-6 text-[#46514b]">{review.negative_text}</p></div>}{review.published_reply && <div className="mt-6 border-l-2 border-[#a9b1ac] pl-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#89928d]">Risposta già pubblicata</p><p className="mt-2 text-sm italic leading-6 text-[#68746e]">{review.published_reply}</p></div>}{review.source_url && <a className="button-ghost mt-7 px-0" href={review.source_url} rel="noreferrer" target="_blank">Apri sulla piattaforma <Icon name="external" size={16} /></a>}</div></article>
      <DraftEditor demo={context.demo} initialDraft={review.latest_draft} reviewId={review.id} />
    </div>
  </div>;
}
