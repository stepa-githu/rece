import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { encryptCredentials } from "@/lib/crypto";
import { appUrl } from "@/lib/env";
import { discoverGoogleLocations, exchangeGoogleCode } from "@/lib/providers/google";
import { createAdminClient } from "@/lib/supabase/admin";

function back(message: string) { return NextResponse.redirect(`${appUrl}/integrations?google_error=${encodeURIComponent(message)}`); }

export async function GET(request: NextRequest) {
  const context = await getCurrentContext(); if (!context?.hotel || context.demo) return NextResponse.redirect(`${appUrl}/login`);
  const code = request.nextUrl.searchParams.get("code"); const state = request.nextUrl.searchParams.get("state"); const expected = request.cookies.get("rece_google_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) return back("Stato OAuth non valido. Riprova il collegamento.");
  try {
    const credentials = await exchangeGoogleCode(code); if (!credentials.accessToken) throw new Error("Access token Google mancante.");
    const locations = await discoverGoogleLocations(credentials.accessToken); if (!locations.length) throw new Error("Nessuna sede Google Business accessibile o verificata.");
    const selected = locations.length === 1 ? locations[0] : null; const admin = createAdminClient();
    const { data: integration, error } = await admin.from("integrations").upsert({ hotel_id: context.hotel.id, provider: "google", status: selected ? "connected" : "pending_location", external_account_id: selected?.accountId || null, external_location_id: selected?.locationId || null, external_location_name: selected?.name || null, available_locations: locations, last_error: null }, { onConflict: "hotel_id,provider" }).select("id").single();
    if (error) throw error; await admin.from("integration_secrets").upsert({ integration_id: integration.id, encrypted_credentials: await encryptCredentials(credentials) });
    const response = NextResponse.redirect(`${appUrl}/integrations?google=${selected ? "connected" : "choose_location"}`); response.cookies.delete("rece_google_oauth_state"); return response;
  } catch (cause) { return back(cause instanceof Error ? cause.message : "Collegamento Google non riuscito."); }
}
