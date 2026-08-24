import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { encryptCredentials } from "@/lib/crypto";
import { fetchBookingReviews } from "@/lib/providers/booking";
import { fetchTripadvisorReviews } from "@/lib/providers/tripadvisor";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403); const { provider } = await params; if (!new Set(["booking", "tripadvisor"]).has(provider)) return apiError("Fonte non configurabile da qui.");
  const body = await readJson<Record<string, unknown>>(request).catch(() => null); const locationId = cleanText(body?.locationId, 200); const secret = cleanText(body?.secret, 5000); if (!locationId || !secret) return apiError("Identificativo e credenziale sono obbligatori."); if (context.demo) return NextResponse.json({ message: `${provider} collegato.` });
  try {
    if (provider === "booking") await fetchBookingReviews(locationId, secret, true); else await fetchTripadvisorReviews(locationId, secret, true);
    const admin = createAdminClient(); const { data: integration, error: upsertError } = await admin.from("integrations").upsert({ hotel_id: context.hotel.id, provider, status: "connected", external_location_id: locationId, external_location_name: provider === "booking" ? `Property ${locationId}` : `Location ${locationId}`, last_error: null }, { onConflict: "hotel_id,provider" }).select("id").single(); if (upsertError) throw upsertError;
    const credentials = provider === "booking" ? { accessToken: secret } : { apiKey: secret }; const { error: secretError } = await admin.from("integration_secrets").upsert({ integration_id: integration.id, encrypted_credentials: await encryptCredentials(credentials) }); if (secretError) throw secretError;
    return NextResponse.json({ message: `${provider === "booking" ? "Booking.com" : "Tripadvisor"} collegato.` });
  } catch (cause) { return apiError(cause instanceof Error ? cause.message : "Verifica del collegamento non riuscita.", 422); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403); const { provider } = await params; if (!new Set(["google", "booking", "tripadvisor"]).has(provider)) return apiError("Fonte non valida."); if (context.demo) return NextResponse.json({ message: "Fonte scollegata." });
  const admin = createAdminClient(); const { data: integration } = await admin.from("integrations").select("id").eq("hotel_id", context.hotel.id).eq("provider", provider).maybeSingle(); if (integration) await admin.from("integration_secrets").delete().eq("integration_id", integration.id);
  const { error: updateError } = await admin.from("integrations").update({ status: "disconnected", external_account_id: null, external_location_id: null, external_location_name: null, available_locations: [], last_synced_at: null, last_error: null }).eq("hotel_id", context.hotel.id).eq("provider", provider); if (updateError) return apiError(updateError.message, 500); return NextResponse.json({ message: "Fonte scollegata." });
}
