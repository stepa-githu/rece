"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";

export function SetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Configurazione non riuscita");
      setOk(true);
      setMessage("Centro clienti attivato. Ora puoi accedere.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Configurazione non riuscita");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <label>
        <span className="mb-1.5 block text-sm font-bold">Codice di configurazione</span>
        <input
          className="field"
          name="setupToken"
          placeholder="Il valore SETUP_TOKEN di Vercel"
          required
          type="password"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-bold">Il tuo nome</span>
          <input className="field" name="fullName" required />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-bold">Email amministratore Rece</span>
          <input className="field" name="email" required type="email" />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-bold">Password</span>
          <input className="field" minLength={10} name="password" required type="password" />
        </label>
      </div>
      <p className="text-xs leading-5 text-[#68746e]">
        Questo account potrà soltanto creare e vedere le strutture clienti. Non potrà
        consultare recensioni, conoscenza o impostazioni degli hotel.
      </p>
      <button className="button-primary w-full" disabled={loading || ok}>
        {loading ? (
          "Configuro…"
        ) : ok ? (
          <>
            <Icon name="check" size={17} /> Completato
          </>
        ) : (
          "Crea amministratore Rece"
        )}
      </button>
      {message && (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
