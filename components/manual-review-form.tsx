"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

const channels = ["Google", "Booking.com", "Tripadvisor", "Airbnb", "Expedia", "Facebook", "HolidayCheck", "Email o questionario"];

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function ManualReviewForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [channel, setChannel] = useState("Google");
  const [ratingScale, setRatingScale] = useState("5");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, busy]);

  function chooseChannel(value: string) {
    setChannel(value);
    if (value === "Booking.com") setRatingScale("10");
    else if (value !== "other") setRatingScale("5");
  }

  function startNew() {
    setCreatedId("");
    setError("");
    setChannel("Google");
    setRatingScale("5");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: values.get("authorName"),
          channel: values.get("channel"),
          customChannel: values.get("customChannel"),
          rating: values.get("rating"),
          ratingScale: values.get("ratingScale"),
          reviewDate: values.get("reviewDate"),
          language: values.get("language"),
          title: values.get("title"),
          body: values.get("body"),
          sourceUrl: values.get("sourceUrl"),
        }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "Salvataggio non riuscito.");
      form.reset();
      setCreatedId(result.id);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Si è verificato un errore.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button className="button-primary" onClick={() => { startNew(); setOpen(true); }} type="button"><Icon name="plus" size={17} /> Aggiungi recensione</button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17211d]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target && !busy) setOpen(false); }}>
      <section aria-labelledby="manual-review-title" aria-modal="true" className="max-h-[94vh] w-full overflow-y-auto rounded-t-[1.4rem] bg-white shadow-2xl sm:max-w-3xl sm:rounded-[1.4rem]" role="dialog">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e7e7df] bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#ec765f]">Fonte manuale</p><h2 className="mt-1 text-xl font-black tracking-[-0.025em]" id="manual-review-title">Inserisci una recensione</h2><p className="mt-1 text-sm text-[#68746e]">Indica sempre il canale dove è stata pubblicata.</p></div>
          <button aria-label="Chiudi" className="button-ghost h-10 min-h-10 w-10 shrink-0 p-0" disabled={busy} onClick={() => setOpen(false)} type="button"><Icon name="close" size={19} /></button>
        </header>

        {createdId ? <div className="grid min-h-80 place-items-center p-7 text-center"><div className="max-w-sm"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf5f0] text-[#2f7a64]"><Icon name="check" size={25} /></span><h3 className="mt-4 text-xl font-black">Recensione aggiunta</h3><p className="mt-2 text-sm leading-6 text-[#68746e]">È pronta per essere letta e per generare la risposta con l’AI.</p><div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row"><Link className="button-primary" href={`/reviews/${createdId}`} onClick={() => setOpen(false)}>Apri recensione <Icon name="arrow" size={17} /></Link><button className="button-secondary" onClick={startNew} type="button">Inseriscine un’altra</button></div></div></div> :
        <form className="p-5 sm:p-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-sm font-bold">Canale originale *</span><select className="field" name="channel" onChange={(event) => chooseChannel(event.target.value)} value={channel}>{channels.map((item) => <option key={item} value={item}>{item}</option>)}<option value="other">Altro…</option></select></label>
            {channel === "other" ? <label><span className="mb-1.5 block text-sm font-bold">Nome del canale *</span><input autoFocus className="field" maxLength={80} name="customChannel" placeholder="Es. Zoover" required /></label> : <label><span className="mb-1.5 block text-sm font-bold">Autore</span><input className="field" maxLength={160} name="authorName" placeholder="Es. Mario Rossi" /></label>}
            {channel === "other" && <label><span className="mb-1.5 block text-sm font-bold">Autore</span><input className="field" maxLength={160} name="authorName" placeholder="Es. Mario Rossi" /></label>}
            <label><span className="mb-1.5 block text-sm font-bold">Data recensione *</span><input className="field" defaultValue={localToday()} max={localToday()} name="reviewDate" required type="date" /></label>
            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3"><label><span className="mb-1.5 block text-sm font-bold">Voto</span><input className="field" max={ratingScale} min="0.1" name="rating" placeholder={ratingScale === "10" ? "Es. 8,5" : "Es. 4,5"} step="0.1" type="number" /></label><label><span className="mb-1.5 block text-sm font-bold">Scala</span><select className="field" name="ratingScale" onChange={(event) => setRatingScale(event.target.value)} value={ratingScale}><option value="5">su 5</option><option value="10">su 10</option></select></label></div>
            <label><span className="mb-1.5 block text-sm font-bold">Lingua</span><select className="field" defaultValue="" name="language"><option value="">Rileva dal testo</option><option value="it">Italiano</option><option value="en">Inglese</option><option value="de">Tedesco</option><option value="fr">Francese</option><option value="es">Spagnolo</option><option value="nl">Olandese</option></select></label>
            <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-bold">Titolo</span><input className="field" maxLength={240} name="title" placeholder="Titolo della recensione, se presente" /></label>
            <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-bold">Testo della recensione *</span><textarea className="field min-h-36 resize-y leading-6" maxLength={12000} name="body" placeholder="Incolla qui il testo completo della recensione…" required /></label>
            <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-bold">Link originale <span className="font-normal text-[#89928d]">(facoltativo)</span></span><input className="field" inputMode="url" name="sourceUrl" placeholder="https://…" type="url" /></label>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700" role="alert">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#ecece5] pt-5 sm:flex-row sm:justify-end"><button className="button-ghost" disabled={busy} onClick={() => setOpen(false)} type="button">Annulla</button><button className="button-primary" disabled={busy} type="submit">{busy ? "Salvataggio…" : "Salva recensione"}</button></div>
        </form>}
      </section>
    </div>}
  </>;
}
