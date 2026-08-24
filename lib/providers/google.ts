import { appUrl, requireServerEnv } from "@/lib/env";
import type { NormalizedReview, ProviderCredentials } from "@/lib/providers/types";

const ratingMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

interface GoogleReview {
  reviewId?: string;
  name?: string;
  reviewer?: { displayName?: string };
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: { comment?: string };
  [key: string]: unknown;
}

async function googleFetch(url: string, accessToken: string) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: { message?: string } }).error?.message || `Google API: errore ${response.status}`);
  return data as Record<string, unknown>;
}

export function googleAuthorizationUrl(state: string) {
  const params = new URLSearchParams({ client_id: requireServerEnv("GOOGLE_CLIENT_ID"), redirect_uri: `${appUrl}/api/integrations/google/callback`, response_type: "code", access_type: "offline", prompt: "consent", include_granted_scopes: "true", scope: "https://www.googleapis.com/auth/business.manage", state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string): Promise<ProviderCredentials> {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: requireServerEnv("GOOGLE_CLIENT_ID"), client_secret: requireServerEnv("GOOGLE_CLIENT_SECRET"), redirect_uri: `${appUrl}/api/integrations/google/callback`, grant_type: "authorization_code" }) });
  const result = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error_description || "Google non ha restituito un access token.");
  return { accessToken: result.access_token, refreshToken: result.refresh_token, expiresAt: Date.now() + (result.expires_in || 3600) * 1000 };
}

export async function refreshGoogleCredentials(credentials: ProviderCredentials) {
  if (credentials.accessToken && credentials.expiresAt && credentials.expiresAt > Date.now() + 60_000) return credentials;
  if (!credentials.refreshToken) throw new Error("Google richiede un nuovo collegamento.");
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ refresh_token: credentials.refreshToken, client_id: requireServerEnv("GOOGLE_CLIENT_ID"), client_secret: requireServerEnv("GOOGLE_CLIENT_SECRET"), grant_type: "refresh_token" }) });
  const result = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error_description || "Impossibile aggiornare il token Google.");
  return { ...credentials, accessToken: result.access_token, expiresAt: Date.now() + (result.expires_in || 3600) * 1000 };
}

export async function discoverGoogleLocations(accessToken: string) {
  const accountResult = await googleFetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", accessToken);
  const accounts = Array.isArray(accountResult.accounts) ? accountResult.accounts as Array<{ name?: string; accountName?: string }> : [];
  const locations: Array<{ accountId: string; locationId: string; name: string }> = [];
  for (const account of accounts.slice(0, 10)) {
    if (!account.name) continue;
    const result = await googleFetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storeCode,websiteUri&pageSize=100`, accessToken);
    const rows = Array.isArray(result.locations) ? result.locations as Array<{ name?: string; title?: string; storeCode?: string }> : [];
    for (const location of rows) if (location.name) locations.push({ accountId: account.name, locationId: location.name, name: location.title || location.storeCode || location.name });
  }
  return locations;
}

export async function fetchGoogleReviews(accessToken: string, accountId: string, locationId: string) {
  const account = accountId.replace(/^accounts\//, ""); const location = locationId.replace(/^locations\//, "");
  let next = ""; const results: NormalizedReview[] = [];
  for (let page = 0; page < 10; page += 1) {
    const query = new URLSearchParams({ pageSize: "50", orderBy: "updateTime desc" }); if (next) query.set("pageToken", next);
    const data = await googleFetch(`https://mybusiness.googleapis.com/v4/accounts/${account}/locations/${location}/reviews?${query}`, accessToken);
    const reviews = Array.isArray(data.reviews) ? data.reviews as GoogleReview[] : [];
    for (const review of reviews) {
      const externalId = String(review.reviewId || review.name || ""); if (!externalId) continue;
      results.push({ provider: "google", external_id: externalId, author_name: review.reviewer?.displayName || null, author_country: null, rating: ratingMap[String(review.starRating)] || null, rating_scale: 5, title: null, body: review.comment || null, positive_text: null, negative_text: null, language: null, review_date: review.createTime || review.updateTime || new Date().toISOString(), source_url: "https://business.google.com/", published_reply: review.reviewReply?.comment || null, raw_payload: review as Record<string, unknown> });
    }
    next = typeof data.nextPageToken === "string" ? data.nextPageToken : ""; if (!next) break;
  }
  return results;
}
