import type { NormalizedReview } from "@/lib/providers/types";

interface TripadvisorReview {
  id?: string | number;
  review_id?: string | number;
  reviewId?: string | number;
  user?: { username?: string; display_name?: string; name?: string; country?: string; country_code?: string };
  author?: TripadvisorReview["user"];
  reviewer?: TripadvisorReview["user"];
  username?: string;
  rating?: number | string;
  title?: string;
  headline?: string;
  text?: string;
  body?: string;
  content?: string;
  language?: string;
  language_code?: string;
  language_meta?: { original_language?: string };
  published_date?: string;
  published_at?: string;
  date?: string;
  created_at?: string;
  web_url?: string;
  url?: string;
  owner_response?: { text?: string };
  response?: { text?: string };
  [key: string]: unknown;
}

interface TripadvisorPayload {
  detail?: string;
  message?: string;
  data?: TripadvisorReview[];
  reviews?: TripadvisorReview[];
}

export async function fetchTripadvisorReviews(locationId: string, apiKey: string, verifyOnly = false) {
  const params = new URLSearchParams({ language: "primary" }); if (verifyOnly) params.set("limit", "1");
  const response = await fetch(`https://terra.tripadvisor.com/api/locations/${encodeURIComponent(locationId)}/reviews?${params}`, { headers: { "X-API-Key": apiKey, Accept: "application/json" }, cache: "no-store" });
  const payload = await response.json().catch(() => ({})) as TripadvisorPayload;
  if (!response.ok) throw new Error(payload.detail || payload.message || `Tripadvisor Terra: errore ${response.status}.`);
  const rows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.reviews) ? payload.reviews : [];
  return rows.map((review, index): NormalizedReview => {
    const user = review.user || review.author || review.reviewer || {}; const id = String(review.id || review.review_id || review.reviewId || `${locationId}-${index}-${review.published_date || review.date || "review"}`);
    return { provider: "tripadvisor", external_id: id, author_name: user.username || user.display_name || user.name || review.username || null, author_country: user.country || user.country_code || null, rating: Number.isFinite(Number(review.rating)) ? Number(review.rating) : null, rating_scale: 5, title: review.title || review.headline || null, body: review.text || review.body || review.content || null, positive_text: null, negative_text: null, language: review.language || review.language_code || review.language_meta?.original_language || null, review_date: review.published_date || review.published_at || review.date || review.created_at || new Date().toISOString(), source_url: review.web_url || review.url || "https://www.tripadvisor.it/", published_reply: review.owner_response?.text || review.response?.text || null, raw_payload: review as Record<string, unknown> };
  });
}
