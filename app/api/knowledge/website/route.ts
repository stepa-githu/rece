import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { crawlWebsite } from "@/lib/crawler";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403);
  const body = await readJson<{ url?: string }>(request).catch(() => null); const url = cleanText(body?.url, 500); if (!url) return apiError("Inserisci l’indirizzo del sito.");
  if (context.demo) return NextResponse.json({ message: "Sito acquisito: 8 pagine lette." });
  const admin = createAdminClient();
  try {
    const result = await crawlWebsite(url, 8); const title = `Sito ufficiale · ${new URL(url).hostname}`; const record = { hotel_id: context.hotel.id, source_type: "website", title, source_url: url, extracted_text: result.text, status: "ready", character_count: result.text.length, error_message: null };
    const { data: existing } = await admin.from("knowledge_sources").select("id").eq("hotel_id", context.hotel.id).eq("source_url", url).maybeSingle();
    const operation = existing ? admin.from("knowledge_sources").update(record).eq("id", existing.id) : admin.from("knowledge_sources").insert(record); const { error: writeError } = await operation; if (writeError) throw writeError;
    return NextResponse.json({ message: `Sito acquisito: ${result.pages.length} pagine lette.` });
  } catch (cause) { return apiError(cause instanceof Error ? cause.message : "Impossibile leggere il sito.", 422); }
}
