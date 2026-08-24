import { NextResponse } from "next/server";
import { apiError, cleanText, readJson } from "@/lib/api";
import { appUrl } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await readJson<Record<string, unknown>>(request).catch(() => null); if (!body) return apiError("Richiesta non valida.");
  const configuredToken = process.env.SETUP_TOKEN; const providedToken = cleanText(body.setupToken, 500); if (!configuredToken || providedToken !== configuredToken) return apiError("Codice di configurazione non valido.", 403);
  const hotelName = cleanText(body.hotelName, 160); const site = cleanText(body.officialSiteUrl, 500) || null; const fullName = cleanText(body.fullName, 160); const email = cleanText(body.email, 320).toLowerCase(); const password = cleanText(body.password, 200);
  if (!hotelName || !fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10) return apiError("Completa tutti i campi; la password deve avere almeno 10 caratteri.");
  const admin = createAdminClient(); const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }); if ((count || 0) > 0) return apiError("La configurazione iniziale è già stata completata.", 409);
  const { data: hotel, error: hotelError } = await admin.from("hotels").insert({ name: hotelName, slug: slugify(hotelName), official_site_url: site }).select("id").single(); if (hotelError) return apiError(hotelError.message, 500);
  const { data: authData, error: authError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName, hotel_id: hotel.id, role: "admin", app_url: appUrl } });
  if (authError || !authData.user) { await admin.from("hotels").delete().eq("id", hotel.id); return apiError(authError?.message || "Creazione utente non riuscita.", 500); }
  await Promise.all([
    admin.from("integrations").insert((["google", "booking", "tripadvisor"] as const).map((provider) => ({ hotel_id: hotel.id, provider, status: "disconnected" }))),
    admin.from("tone_profiles").insert({ hotel_id: hotel.id, signature: `Lo staff di ${hotelName}` }),
  ]);
  return NextResponse.json({ message: "Configurazione completata." });
}
