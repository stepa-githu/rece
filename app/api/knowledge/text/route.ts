import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403);
  const body = await readJson<{ title?: string; text?: string }>(request).catch(() => null); const title = cleanText(body?.title, 160); const text = cleanText(body?.text, 100_000); if (!title || text.length < 20) return apiError("Inserisci un titolo e almeno 20 caratteri.");
  if (context.demo) return NextResponse.json({ message: "Nota aggiunta." });
  const admin = createAdminClient(); const { error: insertError } = await admin.from("knowledge_sources").insert({ hotel_id: context.hotel.id, source_type: "text", title, extracted_text: text, status: "ready", character_count: text.length });
  if (insertError) return apiError(insertError.message, 500); return NextResponse.json({ message: "Nota aggiunta alla conoscenza." });
}
