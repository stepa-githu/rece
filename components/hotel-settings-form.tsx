"use client";

import { useState } from "react";
import type { Hotel } from "@/types";

export function HotelSettingsForm({ hotel, demo }: { hotel: Hotel; demo: boolean }) {
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(""); const form = new FormData(event.currentTarget);
    try { const response = await fetch("/api/hotel", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "Salvataggio non riuscito"); setMessage(demo ? "Modifica simulata in modalità demo." : "Dati della struttura salvati."); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Salvataggio non riuscito"); }
    finally { setLoading(false); }
  }
  return <form className="panel max-w-3xl space-y-5 p-5 sm:p-7" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-bold">Nome struttura</span><input className="field" defaultValue={hotel.name} name="name" required /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-bold">Sito ufficiale</span><input className="field" defaultValue={hotel.official_site_url || ""} name="officialSiteUrl" type="url" placeholder="https://www.nomehotel.it" /></label><label><span className="mb-1.5 block text-sm font-bold">Lingua principale</span><select className="field" defaultValue={hotel.default_language} name="defaultLanguage"><option value="it">Italiano</option><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option></select></label><label><span className="mb-1.5 block text-sm font-bold">Fuso orario</span><select className="field" defaultValue={hotel.timezone} name="timezone"><option value="Europe/Rome">Europe/Rome</option><option value="Europe/London">Europe/London</option><option value="Europe/Berlin">Europe/Berlin</option></select></label></div><div className="flex flex-wrap items-center gap-3"><button className="button-primary" disabled={loading}>{loading ? "Salvo…" : "Salva dati"}</button>{message && <p className="text-sm font-bold text-[#2f7a64]">{message}</p>}</div></form>;
}
