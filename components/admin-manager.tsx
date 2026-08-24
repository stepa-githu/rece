"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import type { Hotel, Profile } from "@/types";

export function AdminManager({ hotels, profiles, demo }: { hotels: Hotel[]; profiles: Profile[]; demo: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function createHotel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setFailed(false);

    try {
      const response = await fetch("/api/admin/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      const result = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error || "Operazione non riuscita");

      setMessage(
        demo
          ? `${result.message || "Operazione simulata"} (demo)`
          : result.message || "Struttura creata e invito inviato.",
      );
      event.currentTarget.reset();
      router.refresh();
    } catch (cause) {
      setFailed(true);
      setMessage(cause instanceof Error ? cause.message : "Operazione non riuscita");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf5f0] text-[#2f7a64]">
            <Icon name="hotel" />
          </span>
          <div>
            <h2 className="font-extrabold">Aggiungi una struttura</h2>
            <p className="text-xs text-[#89928d]">
              Crea l’hotel e il suo primo accesso in un solo passaggio
            </p>
          </div>
        </div>

        <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={createHotel}>
          <label>
            <span className="mb-1.5 block text-sm font-bold">Nome struttura</span>
            <input className="field" name="name" placeholder="Hotel Aurora" required />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-bold">Sito ufficiale</span>
            <input
              className="field"
              name="officialSiteUrl"
              placeholder="https://www.hotelaurora.it"
              type="url"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-bold">Nome referente</span>
            <input className="field" name="fullName" placeholder="Nome e cognome" required />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-bold">Email referente</span>
            <input className="field" name="email" placeholder="email@struttura.it" type="email" required />
          </label>
          <div className="lg:col-span-2">
            <button className="button-primary" disabled={busy}>
              <Icon name={busy ? "refresh" : "mail"} size={17} />
              {busy ? "Creo e invio…" : "Crea struttura e invia accesso"}
            </button>
          </div>
        </form>
      </section>

      {message && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-bold ${
            failed ? "bg-red-50 text-red-700" : "bg-[#eaf5f0] text-[#2f7a64]"
          }`}
        >
          {message}
        </p>
      )}

      <section className="panel overflow-hidden">
        <div className="border-b border-[#e7e7df] px-5 py-4">
          <h2 className="font-extrabold">Strutture clienti</h2>
          <p className="mt-1 text-xs text-[#89928d]">{hotels.length} spazi configurati</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#fbfaf6] text-xs uppercase tracking-wide text-[#89928d]">
              <tr>
                <th className="px-5 py-3">Struttura</th>
                <th className="px-5 py-3">Referente</th>
                <th className="px-5 py-3">Accesso</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((hotel) => {
                const profile = profiles.find((item) => item.hotel_id === hotel.id);
                return (
                  <tr className="border-t border-[#ecece5]" key={hotel.id}>
                    <td className="px-5 py-4">
                      <strong className="block">{hotel.name}</strong>
                      <span className="text-xs text-[#89928d]">
                        {hotel.official_site_url || "Sito non indicato"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {profile ? (
                        <>
                          <strong className="block">{profile.full_name || "Senza nome"}</strong>
                          <span className="text-xs text-[#89928d]">{profile.email}</span>
                        </>
                      ) : (
                        <span className="text-[#89928d]">Nessun referente associato</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          profile?.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {profile?.active ? "Attivo" : "Non disponibile"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
