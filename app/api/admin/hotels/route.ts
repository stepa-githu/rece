import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { context, error } = await getApiContext({ admin: true }); if (error || !context) return error ?? apiError("Non autenticato.", 401);
  const body = await readJson<Record<string, unknown>>(request).catch(() => null); const name = cleanText(body?.name, 160); const site = cleanText(body?.officialSiteUrl, 500) || null; if (!name) return apiError("Inserisci il nome della struttura.");
  if (context.demo) return NextResponse.json({ message: "Struttura creata." });
  const admin = createAdminClient(); let slug = slugify(name); const { data: exists } = await admin.from("hotels").select("id").eq("slug", slug).maybeSingle(); if (exists) slug = `${slug}-${String(Date.now()).slice(-5)}`;
  const { data: hotel, error: hotelError } = await admin.from("hotels").insert({ name, slug, official_site_url: site }).select("id").single(); if (hotelError) return apiError(hotelError.message, 500);
  await Promise.all([
    admin.from("integrations").insert((["google", "booking", "tripadvisor"] as const).map((provider) => ({ hotel_id: hotel.id, provider, status: "disconnected" }))),
    admin.from("tone_profiles").insert({ hotel_id: hotel.id, signature: `Lo staff di ${name}` }),
  ]);
  return NextResponse.json({ message: "Struttura creata.", hotelId: hotel.id });
}
