import type { NormalizedReview } from "@/lib/providers/types";

interface BookingReview {
  review_id?: string;
  reviewer?: { name?: string; country_code?: string } | null;
  scoring?: { review_score?: number | string | null } | null;
  content?: { headline?: string; positive?: string; negative?: string; language_code?: string } | null;
  created_timestamp?: string;
  reply?: { text?: string } | null;
  response?: { text?: string } | null;
  [key: string]: unknown;
}

interface BookingPayload {
  errors?: Array<{ message?: string }>;
  meta?: { next_page?: string };
  data?: { reviews?: BookingReview[] };
}

function ensureBookingUrl(value: string) {
  const url = new URL(value, "https://supply-xml.booking.com");
  if (url.protocol !== "https:" || url.hostname !== "supply-xml.booking.com") throw new Error("Paginazione Booking.com non valida.");
  return url.toString();
}

export async function fetchBookingReviews(propertyId: string, accessToken: string, verifyOnly = false) {
  let url = `https://supply-xml.booking.com/review-api/properties/${encodeURIComponent(propertyId)}/reviews?limit=${verifyOnly ? 1 : 50}`; const results: NormalizedReview[] = [];
  for (let page = 0; page < (verifyOnly ? 1 : 10); page += 1) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }, cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as BookingPayload;
    if (!response.ok) throw new Error(payload.errors?.[0]?.message || `Booking.com: errore ${response.status}. Verifica permesso review-api e token.`);
    const reviews = Array.isArray(payload?.data?.reviews) ? payload.data.reviews : [];
    for (const review of reviews) {
      const externalId = String(review.review_id || ""); if (!externalId) continue;
      results.push({ provider: "booking", external_id: externalId, author_name: review.reviewer?.name || null, author_country: review.reviewer?.country_code || null, rating: Number.isFinite(Number(review.scoring?.review_score)) ? Number(review.scoring?.review_score) : null, rating_scale: 10, title: review.content?.headline || null, body: null, positive_text: review.content?.positive || null, negative_text: review.content?.negative || null, language: review.content?.language_code || null, review_date: review.created_timestamp ? new Date(`${String(review.created_timestamp).replace(" ", "T")}Z`).toISOString() : new Date().toISOString(), source_url: "https://admin.booking.com/", published_reply: review.reply?.text || review.response?.text || null, raw_payload: review as Record<string, unknown> });
    }
    const next = payload?.meta?.next_page; if (!next || verifyOnly) break; url = ensureBookingUrl(String(next));
  }
  return results;
}
