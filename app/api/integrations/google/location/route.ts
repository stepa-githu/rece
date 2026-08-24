import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403); const body = await readJson<Record<string, unknown>>(request).catch(() => null); if (!body) return apiError("Richiesta non valida.");
  const accountId = cleanText(body.accountId, 200); const locationId = cleanText(body.locationId, 200); const name = cleanText(body.name, 300); if (!accountId || !locationId || !name) return apiError("Sede Google non valida."); if (context.demo) return NextResponse.json({ message: "Sede collegata." });
  const admin = createAdminClient(); const { data: integration } = await admin.from("integrations").select("available_locations").eq("hotel_id", context.hotel.id).eq("provider", "google").maybeSingle(); const locations = Array.isArray(integration?.available_locations) ? integration.available_locations as Array<Record<string, unknown>> : [];
  const allowed = locations.some((item) => item.accountId === accountId && item.locationId === locationId); if (!allowed) return apiError("La sede non appartiene al collegamento Google.", 403);
  const { error: updateError } = await admin.from("integrations").update({ status: "connected", external_account_id: accountId, external_location_id: locationId, external_location_name: name, last_error: null }).eq("hotel_id", context.hotel.id).eq("provider", "google"); if (updateError) return apiError(updateError.message, 500);
  return NextResponse.json({ message: "Sede Google collegata." });
}
