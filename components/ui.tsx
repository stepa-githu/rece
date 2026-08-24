import Link from "next/link";
import { Icon } from "@/components/icons";
import type { ReviewProvider } from "@/types";

export function Logo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return <span className={`inline-flex items-baseline gap-1 text-[1.55rem] font-black tracking-[-0.08em] ${inverse ? "text-white" : "text-[#17211d]"}`}>rece<span className="text-[#ec765f]">.</span>{!compact && <span className={`ml-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] ${inverse ? "text-white/45" : "text-[#8a948e]"}`}>hospitality</span>}</span>;
}

const providers: Record<ReviewProvider, { label: string; letter: string; classes: string }> = {
  google: { label: "Google", letter: "G", classes: "bg-blue-50 text-blue-700" }, booking: { label: "Booking.com", letter: "B", classes: "bg-indigo-50 text-indigo-700" }, tripadvisor: { label: "Tripadvisor", letter: "T", classes: "bg-emerald-50 text-emerald-700" }, manual: { label: "Manuale", letter: "M", classes: "bg-stone-100 text-stone-700" },
};

export function ProviderBadge({ provider }: { provider: ReviewProvider }) {
  const item = providers[provider];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${item.classes}`}><span className="grid h-4 w-4 place-items-center rounded-full bg-white/80 text-[9px] font-black">{item.letter}</span>{item.label}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    new: { label: "Da gestire", classes: "bg-orange-50 text-orange-700" }, drafted: { label: "Bozza pronta", classes: "bg-violet-50 text-violet-700" }, handled: { label: "Gestita", classes: "bg-emerald-50 text-emerald-700" }, ignored: { label: "Ignorata", classes: "bg-stone-100 text-stone-600" }, connected: { label: "Collegata", classes: "bg-emerald-50 text-emerald-700" }, pending_location: { label: "Completa collegamento", classes: "bg-amber-50 text-amber-700" }, disconnected: { label: "Non collegata", classes: "bg-stone-100 text-stone-600" }, error: { label: "Errore", classes: "bg-red-50 text-red-700" }, ready: { label: "Pronta", classes: "bg-emerald-50 text-emerald-700" }, processing: { label: "In elaborazione", classes: "bg-blue-50 text-blue-700" },
  };
  const item = config[status] ?? { label: status, classes: "bg-stone-100 text-stone-600" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.classes}`}>{item.label}</span>;
}

export function Rating({ rating, scale = 5 }: { rating: number | null; scale?: number }) {
  if (rating === null) return <span className="text-sm text-stone-400">Senza voto</span>;
  const normalized = (rating / scale) * 5;
  return <span className="inline-flex items-center gap-2" aria-label={`${rating} su ${scale}`}><span className="text-[0.95rem] tracking-[0.08em] text-[#ec765f]" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => (index + .45 <= normalized ? "★" : "☆")).join("")}</span><span className="text-sm font-extrabold text-[#37413c]">{rating.toLocaleString("it-IT", { maximumFractionDigits: 1 })}{scale !== 5 && <span className="font-medium text-stone-400">/{scale}</span>}</span></span>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ec765f]">{eyebrow}</p>}<h1 className="text-2xl font-black tracking-[-0.035em] text-[#17211d] sm:text-[2rem]">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#68746e]">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</header>;
}

export function StatCard({ label, value, detail, tone = "default" }: { label: string; value: string; detail: string; tone?: "default" | "brand" | "sage" }) {
  const tones = { default: "bg-white", brand: "bg-[#fff0eb] border-[#f6d8cf]", sage: "bg-[#eaf5f0] border-[#d5ebe2]" };
  return <article className={`panel min-w-0 p-4 sm:p-5 ${tones[tone]}`}><p className="truncate text-xs font-bold uppercase tracking-[0.11em] text-[#7c8781]">{label}</p><p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#17211d] sm:text-3xl">{value}</p><p className="mt-1 truncate text-xs text-[#7c8781]">{detail}</p></article>;
}

export function DemoBanner() {
  return <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#efddaa] bg-[#fff9e8] px-4 py-3 text-sm text-[#665525]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#f1d785] text-[11px] font-black">D</span><p><strong>Modalità demo.</strong> I dati sono di esempio; dopo aver inserito le chiavi Supabase compariranno login e dati reali.</p></div>;
}

export function EmptyState({ title, text, href, action }: { title: string; text: string; href?: string; action?: string }) {
  return <div className="panel grid min-h-64 place-items-center p-8 text-center"><div className="max-w-sm"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0eb] text-[#d65f49]"><Icon name="reviews" /></span><h2 className="mt-4 text-lg font-extrabold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#68746e]">{text}</p>{href && action && <Link className="button-primary mt-5" href={href}>{action}</Link>}</div></div>;
}
