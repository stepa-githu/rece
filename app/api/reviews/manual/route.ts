import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

interface ManualReviewRequest {
  authorName?: unknown;
  channel?: unknown;
  customChannel?: unknown;
  rating?: unknown;
  ratingScale?: unknown;
  reviewDate?: unknown;
  language?: unknown;
  title?: unknown;
  body?: unknown;
  sourceUrl?: unknown;
}

function parseSourceUrl(value: unknown) {
  const sourceUrl = cleanText(value, 1000);
  if (!sourceUrl) return null;
  try {
    const url = new URL(sourceUrl);
    if (!new Set(["http:", "https:"]).has(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { context, error } = await getApiContext();
  if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403);

  const payload = await readJson<ManualReviewRequest>(request).catch(() => null);
  if (!payload) return apiError("Dati della recensione non validi.");

  const selectedChannel = cleanText(payload.channel, 80);
  const originalChannel = selectedChannel === "other"
    ? cleanText(payload.customChannel, 80)
    : selectedChannel;
  const authorName = cleanText(payload.authorName, 160);
  const title = cleanText(payload.title, 240);
  const body = cleanText(payload.body, 12_000);
  const language = cleanText(payload.language, 12).toLowerCase();
  const reviewDate = cleanText(payload.reviewDate, 10);

  if (!originalChannel) return apiError("Indica il canale originale della recensione.");
  if (!body) return apiError("Inserisci il testo della recensione.");

  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(reviewDate)
    ? new Date(`${reviewDate}T12:00:00.000Z`)
    : null;
  if (!dateValue || Number.isNaN(dateValue.getTime())) return apiError("La data della recensione non è valida.");

  const ratingScale = Number(payload.ratingScale || 5);
  if (![5, 10].includes(ratingScale)) return apiError("La scala del voto deve essere 5 o 10.");

  const rawRating = payload.rating === "" || payload.rating === null || payload.rating === undefined
    ? null
    : Number(payload.rating);
  if (rawRating !== null && (!Number.isFinite(rawRating) || rawRating <= 0 || rawRating > ratingScale)) {
    return apiError(`Il voto deve essere compreso tra 0,1 e ${ratingScale}.`);
  }

  const rawSourceUrl = cleanText(payload.sourceUrl, 1000);
  const sourceUrl = parseSourceUrl(rawSourceUrl);
  if (rawSourceUrl && !sourceUrl) return apiError("Il link originale deve iniziare con http:// o https://.");

  if (context.demo) {
    return NextResponse.json({
      id: `demo-manual-${Date.now()}`,
      message: "Recensione manuale acquisita in modalità demo.",
    });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("reviews")
    .insert({
      hotel_id: context.hotel.id,
      provider: "manual",
      original_channel: originalChannel,
      external_id: `manual-${crypto.randomUUID()}`,
      author_name: authorName || null,
      author_country: null,
      rating: rawRating,
      rating_scale: ratingScale,
      title: title || null,
      body,
      positive_text: null,
      negative_text: null,
      language: language || null,
      review_date: dateValue.toISOString(),
      source_url: sourceUrl,
      published_reply: null,
      workflow_status: "new",
      raw_payload: { entry_mode: "manual", original_channel: originalChannel },
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.message.includes("original_channel")) {
      return apiError("Prima esegui l'aggiornamento SQL per le recensioni manuali.", 500);
    }
    return apiError(insertError.message, 500);
  }

  return NextResponse.json({ id: data.id, message: "Recensione aggiunta." }, { status: 201 });
}
