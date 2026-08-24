import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProviderBadge, Rating, StatusBadge } from "@/components/ui";
import type { Review } from "@/types";

export function ReviewRow({ review, compact = false }: { review: Review; compact?: boolean }) {
  const text = review.body || [review.positive_text, review.negative_text].filter(Boolean).join(" · ") || "Nessun commento testuale";
  const date = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(review.review_date));
  return <Link className="group block border-b border-[#ecece5] px-4 py-4 transition last:border-0 hover:bg-[#fbfaf6] sm:px-5" href={`/reviews/${review.id}`}><div className="flex items-start gap-3 sm:gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><ProviderBadge provider={review.provider} />{review.provider === "manual" && review.original_channel && <span className="text-xs font-bold text-[#68746e]">Canale: {review.original_channel}</span>}<StatusBadge status={review.workflow_status} /><span className="ml-auto hidden text-xs text-[#909994] sm:inline">{date}</span></div><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1"><h3 className="font-extrabold text-[#17211d]">{review.author_name || "Ospite anonimo"}</h3><Rating rating={review.rating} scale={review.rating_scale} /></div>{review.title && <p className="mt-2 text-sm font-bold text-[#37413c]">{review.title}</p>}<p className={`mt-1.5 text-sm leading-6 text-[#68746e] ${compact ? "line-clamp-2" : "line-clamp-3"}`}>{text}</p><span className="mt-2 block text-xs text-[#909994] sm:hidden">{date}</span></div><span className="mt-8 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#9ca49f] transition group-hover:bg-[#fff0eb] group-hover:text-[#d65f49]"><Icon name="arrow" size={18} /></span></div></Link>;
}
