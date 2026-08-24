"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace("/"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Accesso non riuscito."); }
    finally { setLoading(false); }
  }

  if (demo) return <div><div className="rounded-2xl border border-[#efddaa] bg-[#fff9e8] p-4 text-sm leading-6 text-[#665525]">Il progetto è in modalità dimostrativa. Puoi esplorare subito l’interfaccia con dati realistici.</div><Link className="button-primary mt-5 w-full" href="/dashboard">Apri la demo <Icon name="arrow" size={18} /></Link></div>;

  return <form className="space-y-4" onSubmit={submit}>
    <div><label className="mb-1.5 block text-sm font-bold" htmlFor="email">Email</label><input className="field" id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
    <div><label className="mb-1.5 block text-sm font-bold" htmlFor="password">Password</label><input className="field" id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></div>
    {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button className="button-primary w-full" disabled={loading} type="submit">{loading ? "Accesso…" : "Accedi"}</button>
    <p className="text-center text-xs leading-5 text-[#89928d]">Gli accessi alle strutture vengono creati dal centro clienti Rece.</p>
  </form>;
}
