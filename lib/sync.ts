import { decryptCredentials, encryptCredentials } from "@/lib/crypto";
import { fetchBookingReviews } from "@/lib/providers/booking";
import { fetchGoogleReviews, refreshGoogleCredentials } from "@/lib/providers/google";
import { fetchTripadvisorReviews } from "@/lib/providers/tripadvisor";
import type { NormalizedReview, ProviderCredentials } from "@/lib/providers/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReviewProvider } from "@/types";

const supported = new Set<ReviewProvider>(["google", "booking", "tripadvisor"]);

export async function syncIntegration(hotelId: string, provider: ReviewProvider) {
  if (!supported.has(provider)) throw new Error("Fonte non supportata.");
  const admin = createAdminClient();
  const { data: integration, error: integrationError } = await admin.from("integrations").select("*").eq("hotel_id", hotelId).eq("provider", provider).maybeSingle();
  if (integrationError) throw integrationError;
  if (!integration || integration.status !== "connected") throw new Error("Collegamento non attivo.");

  const { data: secretRow, error: secretError } = await admin.from("integration_secrets").select("encrypted_credentials").eq("integration_id", integration.id).maybeSingle();
  if (secretError) throw secretError;
  let credentials: ProviderCredentials = secretRow ? await decryptCredentials<ProviderCredentials>(secretRow.encrypted_credentials) : {};
  const { data: run, error: runError } = await admin.from("sync_runs").insert({ hotel_id: hotelId, integration_id: integration.id, provider, status: "running" }).select("id").single();
  if (runError) throw runError;

  try {
    let reviews: NormalizedReview[] = [];
    if (provider === "google") {
      credentials = await refreshGoogleCredentials(credentials);
      if (!credentials.accessToken || !integration.external_account_id || !integration.external_location_id) throw new Error("Configurazione Google incompleta.");
      reviews = await fetchGoogleReviews(credentials.accessToken, integration.external_account_id, integration.external_location_id);
      const encrypted = await encryptCredentials(credentials);
      await admin.from("integration_secrets").upsert({ integration_id: integration.id, encrypted_credentials: encrypted });
    }
    if (provider === "booking") {
      const token = String(credentials.accessToken || process.env.BOOKING_ACCESS_TOKEN || "");
      if (!token || !integration.external_location_id) throw new Error("Token o Property ID Booking.com mancante.");
      reviews = await fetchBookingReviews(integration.external_location_id, token);
    }
    if (provider === "tripadvisor") {
      const key = String(credentials.apiKey || process.env.TRIPADVISOR_TERRA_API_KEY || "");
      if (!key || !integration.external_location_id) throw new Error("API key o Location ID Tripadvisor mancante.");
      reviews = await fetchTripadvisorReviews(integration.external_location_id, key);
    }

    const ids = reviews.map((review) => review.external_id);
    const { data: existing } = ids.length ? await admin.from("reviews").select("external_id, workflow_status").eq("hotel_id", hotelId).eq("provider", provider).in("external_id", ids) : { data: [] as Array<{ external_id: string; workflow_status: string }> };
    const statuses = new Map((existing ?? []).map((row) => [row.external_id, row.workflow_status]));
    const records = reviews.map((review) => ({ ...review, hotel_id: hotelId, workflow_status: review.published_reply ? "handled" : statuses.get(review.external_id) || "new" }));
    if (records.length) {
      const { error } = await admin.from("reviews").upsert(records, { onConflict: "hotel_id,provider,external_id" });
      if (error) throw error;
    }
    const now = new Date().toISOString();
    await Promise.all([
      admin.from("integrations").update({ status: "connected", last_synced_at: now, last_error: null }).eq("id", integration.id),
      admin.from("sync_runs").update({ status: "success", imported_count: records.length, finished_at: now }).eq("id", run.id),
    ]);
    return { count: records.length, provider };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Errore di sincronizzazione"; const now = new Date().toISOString();
    await Promise.all([
      admin.from("integrations").update({ status: "error", last_error: message }).eq("id", integration.id),
      admin.from("sync_runs").update({ status: "error", error_message: message, finished_at: now }).eq("id", run.id),
    ]);
    throw cause;
  }
}
