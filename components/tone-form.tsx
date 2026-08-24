"use client";

import { useState } from "react";
import type { ToneProfile } from "@/types";

const labels: Record<string, [string, string]> = {
  formality: ["Molto informale", "Molto formale"],
  warmth: ["Essenziale", "Molto caloroso"],
  concision: ["Articolato", "Molto conciso"],
};

export function ToneForm({ initial, demo }: { initial: ToneProfile; demo: boolean }) {
  const [values, setValues] = useState(initial); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  function update(name: keyof ToneProfile, value: string | number) { setValues((current) => ({ ...current, [name]: value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    try { const response = await fetch("/api/tone", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "Salvataggio non riuscito"); setMessage(demo ? "Profilo simulato in modalità demo." : "Tono di voce salvato."); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Salvataggio non riuscito"); }
    finally { setLoading(false); }
  }
  return <form className="space-y-5" onSubmit={submit}>
    <section className="panel p-5 sm:p-6"><h2 className="font-extrabold">Personalità della risposta</h2><div className="mt-6 grid gap-7 lg:grid-cols-3">{(["formality", "warmth", "concision"] as const).map((name) => <label key={name}><span className="flex items-center justify-between text-sm font-extrabold capitalize">{name === "formality" ? "Formalità" : name === "warmth" ? "Calore" : "Sintesi"}<b className="rounded-lg bg-[#fff0eb] px-2 py-1 text-xs text-[#d65f49]">{values[name]}/5</b></span><input className="mt-4 w-full accent-[#ec765f]" type="range" min="1" max="5" value={values[name]} onChange={(event) => update(name, Number(event.target.value))} /><span className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wide text-[#9aa39e]"><span>{labels[name][0]}</span><span>{labels[name][1]}</span></span></label>)}</div></section>
    <section className="panel p-5 sm:p-6"><h2 className="font-extrabold">Regole di scrittura</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label><span className="mb-1.5 block text-sm font-bold">Apertura preferita</span><input className="field" value={values.greeting_style} onChange={(event) => update("greeting_style", event.target.value)} /></label><label><span className="mb-1.5 block text-sm font-bold">Firma</span><input className="field" value={values.signature} onChange={(event) => update("signature", event.target.value)} /></label><label><span className="mb-1.5 block text-sm font-bold">Parole da preferire</span><input className="field" placeholder="accogliere, piacere, cura" value={values.preferred_words} onChange={(event) => update("preferred_words", event.target.value)} /></label><label><span className="mb-1.5 block text-sm font-bold">Parole da evitare</span><input className="field" placeholder="problematica, colpa…" value={values.forbidden_words} onChange={(event) => update("forbidden_words", event.target.value)} /></label></div><label className="mt-4 block"><span className="mb-1.5 block text-sm font-bold">Istruzioni aggiuntive</span><textarea className="field min-h-28" value={values.extra_instructions} onChange={(event) => update("extra_instructions", event.target.value)} /></label></section>
    <section className="panel p-5 sm:p-6"><h2 className="font-extrabold">Un esempio che ti rappresenta</h2><p className="mt-1 text-sm text-[#68746e]">Incolla una o più risposte reali che reputi perfette. È il modo più rapido per far capire lo stile.</p><textarea className="field mt-4 min-h-36" value={values.example_replies} onChange={(event) => update("example_replies", event.target.value)} /></section>
    <div className="flex flex-wrap items-center gap-3"><button className="button-primary" disabled={loading}>{loading ? "Salvo…" : "Salva tono di voce"}</button>{message && <p className="text-sm font-bold text-[#2f7a64]" role="status">{message}</p>}</div>
  </form>;
}
