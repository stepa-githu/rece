"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import type { ReviewDraft } from "@/types";

export function DraftEditor({ reviewId, initialDraft, demo }: { reviewId: string; initialDraft?: ReviewDraft | null; demo: boolean }) {
  const [text, setText] = useState(initialDraft?.edited_text || initialDraft?.generated_text || "");
  const [draftId, setDraftId] = useState(initialDraft?.id || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function generate() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/reviews/${reviewId}/draft`, { method: "POST" });
      const result = await response.json() as { error?: string; draft: ReviewDraft };
      if (!response.ok) throw new Error(result.error || "Generazione non riuscita");
      setText(result.draft.generated_text); setDraftId(result.draft.id); setMessage(demo ? "Bozza dimostrativa generata." : "Nuova bozza pronta.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Si è verificato un errore."); }
    finally { setLoading(false); }
  }

  async function save(status: "draft" | "approved" | "copied" = "draft") {
    if (!draftId || !text.trim()) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/reviews/${reviewId}/draft`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId, editedText: text, status }) });
      const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "Salvataggio non riuscito");
      setMessage(status === "approved" ? "Bozza approvata." : "Modifiche salvate.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Si è verificato un errore."); }
    finally { setSaving(false); }
  }

  async function copy() {
    await navigator.clipboard.writeText(text); await save("copied"); setMessage("Risposta copiata negli appunti.");
  }

  return <section className="panel overflow-hidden">
    <div className="flex items-center justify-between border-b border-[#e7e7df] bg-[#fffaf8] px-4 py-4 sm:px-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0eb] text-[#d65f49]"><Icon name="sparkles" size={19} /></span><div><h2 className="font-extrabold">Risposta suggerita</h2><p className="text-xs text-[#89928d]">Basata su recensione, conoscenza e tono</p></div></div>{text && <span className="text-xs font-bold text-[#7f8984]">{text.length} caratteri</span>}</div>
    <div className="p-4 sm:p-5">
      {text ? <><textarea className="field min-h-[280px] resize-y text-[15px] leading-7" aria-label="Bozza risposta" value={text} onChange={(event) => setText(event.target.value)} /><p className="mt-2 text-xs leading-5 text-[#89928d]">Controlla sempre nomi, dettagli e promesse prima di pubblicare sulla piattaforma originale.</p><div className="mt-4 flex flex-wrap gap-2"><button className="button-primary" onClick={copy} type="button"><Icon name="copy" size={17} /> Copia risposta</button><button className="button-secondary" disabled={saving} onClick={() => save("draft")} type="button">{saving ? "Salvo…" : "Salva modifiche"}</button><button className="button-ghost ml-auto" disabled={loading} onClick={generate} type="button"><Icon name="refresh" size={17} /> Rigenera</button></div></> : <div className="py-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0eb] text-[#d65f49]"><Icon name="sparkles" size={25} /></span><h3 className="mt-4 font-extrabold">Nessuna bozza ancora</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#68746e]">Rece userà i fatti della struttura e risponderà nella stessa lingua dell’ospite.</p><button className="button-primary mt-5" disabled={loading} onClick={generate} type="button">{loading ? "Sto preparando la risposta…" : "Genera risposta con AI"}</button></div>}
      {message && <p className="mt-3 rounded-xl bg-[#f4f5f1] px-3 py-2 text-sm text-[#56615b]" role="status">{message}</p>}
    </div>
  </section>;
}
