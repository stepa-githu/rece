import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(request: Request) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403); const body = await readJson<Record<string, unknown>>(request).catch(() => null); if (!body) return apiError("Richiesta non valida.");
  const number = (name: string) => Math.max(1, Math.min(5, Number(body[name]) || 3));
  const record = { hotel_id: context.hotel.id, formality: number("formality"), warmth: number("warmth"), concision: number("concision"), greeting_style: cleanText(body.greeting_style, 500), signature: cleanText(body.signature, 500), preferred_words: cleanText(body.preferred_words, 2000), forbidden_words: cleanText(body.forbidden_words, 2000), extra_instructions: cleanText(body.extra_instructions, 5000), example_replies: cleanText(body.example_replies, 10_000) };
  if (!record.greeting_style || !record.signature) return apiError("Apertura e firma sono obbligatorie."); if (context.demo) return NextResponse.json({ message: "Tono di voce salvato." });
  const admin = createAdminClient(); const { error: upsertError } = await admin.from("tone_profiles").upsert(record, { onConflict: "hotel_id" }); if (upsertError) return apiError(upsertError.message, 500); return NextResponse.json({ message: "Tono di voce salvato." });
}
