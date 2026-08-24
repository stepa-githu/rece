"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";

export function SetupForm() {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(""); const [ok, setOk] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try { const response = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "Configurazione non riuscita"); setOk(true); setMessage("Configurazione completata. Ora puoi accedere."); setTimeout(() => router.push("/login"), 1200); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Configurazione non riuscita"); }
    finally { setLoading(false); }
  }
  return <form className="space-y-4" onSubmit={submit}><label><span className="mb-1.5 block text-sm font-bold">Codice di configurazione</span><input className="field" name="setupToken" type="password" placeholder="Il valore SETUP_TOKEN di Vercel" required /></label><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-bold">Nome struttura</span><input className="field" name="hotelName" required /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-bold">Sito ufficiale</span><input className="field" name="officialSiteUrl" type="url" /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-bold">Il tuo nome</span><input className="field" name="fullName" required /></label><label><span className="mb-1.5 block text-sm font-bold">Email admin</span><input className="field" name="email" type="email" required /></label><label><span className="mb-1.5 block text-sm font-bold">Password</span><input className="field" name="password" type="password" minLength={10} required /></label></div><button className="button-primary w-full" disabled={loading || ok}>{loading ? "Configuro…" : ok ? <><Icon name="check" size={17} /> Completato</> : "Crea hotel e amministratore"}</button>{message && <p className={`rounded-xl px-3 py-2 text-sm ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p>}</form>;
}
