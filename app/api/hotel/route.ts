import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(request: Request) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403); const body = await readJson<Record<string, unknown>>(request).catch(() => null); if (!body) return apiError("Richiesta non valida.");
  const record = { name: cleanText(body.name, 160), official_site_url: cleanText(body.officialSiteUrl, 500) || null, default_language: cleanText(body.defaultLanguage, 10) || "it", timezone: cleanText(body.timezone, 80) || "Europe/Rome" };
  if (!record.name) return apiError("Il nome della struttura è obbligatorio."); if (context.demo) return NextResponse.json({ message: "Dati salvati." }); const admin = createAdminClient(); const { error: updateError } = await admin.from("hotels").update(record).eq("id", context.hotel.id); if (updateError) return apiError(updateError.message, 500); return NextResponse.json({ message: "Dati salvati." });
}
