"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import type { Integration } from "@/types";

export function IntegrationControls({ integration, demo }: { integration: Integration; demo: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function call(url: string, body?: Record<string, unknown>, method = "POST") {
    setBusy(true); setMessage("");
    try { const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); const result = await response.json() as { error?: string; message?: string }; if (!response.ok) throw new Error(result.error || "Operazione non riuscita"); setMessage(demo ? `${result.message || "Operazione simulata"} (demo)` : result.message || "Operazione completata"); router.refresh(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Operazione non riuscita"); }
    finally { setBusy(false); }
  }

  if (integration.status === "connected") return <div><div className="flex flex-wrap gap-2"><button className="button-secondary" disabled={busy} onClick={() => call(`/api/integrations/${integration.provider}/sync`)} type="button"><Icon name="refresh" size={17} /> {busy ? "Sincronizzo…" : "Sincronizza ora"}</button><button className="button-ghost text-red-600" disabled={busy} onClick={() => call(`/api/integrations/${integration.provider}`, undefined, "DELETE")} type="button">Scollega</button></div>{message && <p className="mt-2 text-xs font-bold text-[#2f7a64]">{message}</p>}</div>;

  if (integration.provider === "google") {
    if (integration.status === "pending_location" && integration.available_locations.length) return <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const selected = integration.available_locations[Number(form.get("location"))]; call("/api/integrations/google/location", selected); }}><select className="field" name="location">{integration.available_locations.map((location, index) => <option value={index} key={`${location.accountId}-${location.locationId}`}>{location.name}</option>)}</select><button className="button-primary" disabled={busy}>Conferma sede</button></form>;
    return <Link className="button-primary" href="/api/integrations/google/start" prefetch={false}>Collega Google Business</Link>;
  }

  return <details className="group"><summary className="button-primary cursor-pointer list-none">Configura {integration.provider === "booking" ? "Booking.com" : "Tripadvisor"}</summary><form className="mt-4 grid gap-3 rounded-2xl bg-[#f7f6f1] p-4" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); call(`/api/integrations/${integration.provider}`, { locationId: form.get("locationId"), secret: form.get("secret") }); }}><label><span className="mb-1 block text-xs font-bold">{integration.provider === "booking" ? "Property ID" : "Location ID"}</span><input className="field" name="locationId" required /></label><label><span className="mb-1 block text-xs font-bold">{integration.provider === "booking" ? "JWT access token partner" : "Terra API key"}</span><input className="field" name="secret" type="password" placeholder="Rimane cifrata e solo sul server" required /></label><button className="button-primary" disabled={busy}>{busy ? "Verifico…" : "Verifica e collega"}</button></form>{message && <p className="mt-2 text-xs font-bold text-[#2f7a64]">{message}</p>}</details>;
}
