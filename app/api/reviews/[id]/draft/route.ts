import { NextResponse } from "next/server";
import { demoReply, generateReviewReply } from "@/lib/ai";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { demoReviews } from "@/lib/demo-data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Review, ToneProfile } from "@/types";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403); const { id } = await params;
  if (context.demo) { const review = demoReviews.find((item) => item.id === id); if (!review) return apiError("Recensione non trovata.", 404); return NextResponse.json({ draft: { id: `demo-${Date.now()}`, review_id: id, generated_text: demoReply(review, context.hotel.name), edited_text: null, status: "draft", model: "demo", created_at: new Date().toISOString() } }); }
  const admin = createAdminClient();
  const [{ data: review, error: reviewError }, { data: tone }, { data: sources }] = await Promise.all([
    admin.from("reviews").select("*").eq("id", id).eq("hotel_id", context.hotel.id).maybeSingle(),
    admin.from("tone_profiles").select("*").eq("hotel_id", context.hotel.id).maybeSingle(),
    admin.from("knowledge_sources").select("title, extracted_text").eq("hotel_id", context.hotel.id).eq("status", "ready").order("updated_at", { ascending: false }).limit(20),
  ]);
  if (reviewError) return apiError(reviewError.message, 500); if (!review) return apiError("Recensione non trovata.", 404);
  const defaultTone: ToneProfile = { hotel_id: context.hotel.id, formality: 3, warmth: 4, concision: 4, greeting_style: "Nome dell'ospite, quando presente", signature: `Lo staff di ${context.hotel.name}`, preferred_words: "", forbidden_words: "", extra_instructions: "", example_replies: "" };
  try {
    const knowledge = (sources ?? []).map((source) => `### ${source.title}\n${source.extracted_text}`).join("\n\n").slice(0, 60_000);
    const generated = await generateReviewReply({ review: review as Review, hotel: context.hotel, tone: (tone as ToneProfile | null) || defaultTone, knowledge });
    const { data: draft, error: draftError } = await admin.from("review_drafts").insert({ hotel_id: context.hotel.id, review_id: id, generated_text: generated.text, model: generated.model, created_by: context.user.id }).select("*").single();
    if (draftError) throw draftError;
    await admin.from("reviews").update({ workflow_status: "drafted" }).eq("id", id).eq("hotel_id", context.hotel.id);
    return NextResponse.json({ draft });
  } catch (cause) { return apiError(cause instanceof Error ? cause.message : "Generazione non riuscita.", 500); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403); const { id } = await params;
  const body = await readJson<{ draftId?: string; editedText?: string; status?: string }>(request).catch(() => null); if (!body) return apiError("Richiesta non valida.");
  const editedText = cleanText(body.editedText, 6000); const allowed = new Set(["draft", "approved", "copied"]); if (!body.draftId || !editedText || !allowed.has(body.status || "draft")) return apiError("Dati della bozza non validi.");
  if (context.demo) return NextResponse.json({ message: "Bozza salvata." });
  const admin = createAdminClient(); const { error: updateError } = await admin.from("review_drafts").update({ edited_text: editedText, status: body.status || "draft" }).eq("id", body.draftId).eq("review_id", id).eq("hotel_id", context.hotel.id);
  if (updateError) return apiError(updateError.message, 500); return NextResponse.json({ message: "Bozza salvata." });
}
