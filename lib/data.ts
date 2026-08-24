import {
  demoContext,
  demoHotel,
  demoIntegrations,
  demoKnowledge,
  demoReviews,
  demoTone,
} from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Integration,
  KnowledgeSource,
  Review,
  ToneProfile,
} from "@/types";

function withLatestDraft(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => {
    const drafts = Array.isArray(row.review_drafts) ? row.review_drafts : [];
    const review = Object.fromEntries(
      Object.entries(row).filter(([key]) => key !== "review_drafts"),
    );
    return { ...review, latest_draft: drafts[0] ?? null } as unknown as Review;
  });
}

export async function getReviews(
  hotelId: string,
  options?: { provider?: string; status?: string; rating?: string; q?: string },
) {
  if (isDemoMode) {
    const query = options?.q?.trim().toLowerCase();
    return demoReviews.filter((review) => {
      const normalizedRating = review.rating
        ? (review.rating / review.rating_scale) * 5
        : 0;
      return (
        (!options?.provider || review.provider === options.provider) &&
        (!options?.status || review.workflow_status === options.status) &&
        (!options?.rating || normalizedRating >= Number(options.rating)) &&
        (!query ||
          [review.author_name, review.title, review.body, review.positive_text]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query))
      );
    });
  }

  const supabase = await createClient();
  let request = supabase
    .from("reviews")
    .select(
      "*, review_drafts(id, review_id, generated_text, edited_text, status, model, created_at)",
    )
    .eq("hotel_id", hotelId)
    .order("review_date", { ascending: false })
    .order("created_at", {
      referencedTable: "review_drafts",
      ascending: false,
    })
    .limit(1, { referencedTable: "review_drafts" })
    .limit(100);

  if (options?.provider) request = request.eq("provider", options.provider);
  if (options?.status) request = request.eq("workflow_status", options.status);
  if (options?.q) {
    const safeQuery = options.q.replace(/[,%()]/g, " ").trim();
    if (safeQuery) {
      request = request.or(
        `author_name.ilike.%${safeQuery}%,title.ilike.%${safeQuery}%,body.ilike.%${safeQuery}%`,
      );
    }
  }

  const { data, error } = await request;
  if (error) throw error;
  const reviews = withLatestDraft((data ?? []) as Array<Record<string, unknown>>);
  if (!options?.rating) return reviews;

  return reviews.filter((review) => {
    if (!review.rating) return false;
    return (review.rating / review.rating_scale) * 5 >= Number(options.rating);
  });
}

export async function getReview(hotelId: string, reviewId: string) {
  if (isDemoMode) return demoReviews.find((item) => item.id === reviewId) ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "*, review_drafts(id, review_id, generated_text, edited_text, status, model, created_at)",
    )
    .eq("hotel_id", hotelId)
    .eq("id", reviewId)
    .order("created_at", {
      referencedTable: "review_drafts",
      ascending: false,
    })
    .limit(1, { referencedTable: "review_drafts" })
    .maybeSingle();

  if (error) throw error;
  return data ? withLatestDraft([data as Record<string, unknown>])[0] : null;
}

export async function getKnowledgeSources(hotelId: string) {
  if (isDemoMode) return demoKnowledge;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_sources")
    .select(
      "id, hotel_id, source_type, title, source_url, file_name, status, character_count, error_message, updated_at",
    )
    .eq("hotel_id", hotelId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as KnowledgeSource[];
}

export async function getToneProfile(hotelId: string) {
  if (isDemoMode) return demoTone;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tone_profiles")
    .select("*")
    .eq("hotel_id", hotelId)
    .maybeSingle();
  if (error) throw error;
  return (data as ToneProfile | null) ?? {
    hotel_id: hotelId,
    formality: 3,
    warmth: 4,
    concision: 4,
    greeting_style: "Nome dell'ospite, quando presente",
    signature: "Lo staff della struttura",
    preferred_words: "",
    forbidden_words: "",
    extra_instructions: "",
    example_replies: "",
  };
}

export async function getIntegrations(hotelId: string) {
  if (isDemoMode) return demoIntegrations;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("hotel_id", hotelId)
    .order("provider");
  if (error) throw error;
  return (data ?? []) as Integration[];
}

export async function getDashboardData(hotelId: string) {
  const reviews = await getReviews(hotelId);
  const normalized = reviews
    .filter((review) => review.rating)
    .map((review) => ((review.rating ?? 0) / review.rating_scale) * 5);
  const average = normalized.length
    ? normalized.reduce((sum, rating) => sum + rating, 0) / normalized.length
    : 0;
  const needsReply = reviews.filter(
    (review) => review.workflow_status === "new",
  ).length;
  const drafted = reviews.filter(
    (review) => review.workflow_status === "drafted",
  ).length;
  const handled = reviews.filter(
    (review) => review.workflow_status === "handled",
  ).length;

  return {
    reviews: reviews.slice(0, 5),
    stats: {
      total: reviews.length,
      average,
      needsReply,
      drafted,
      handled,
    },
  };
}

export async function getAdminData() {
  if (isDemoMode) {
    return {
      hotels: [demoHotel],
      profiles: [demoContext.profile],
    };
  }
  const supabase = await createClient();
  const [{ data: hotels, error: hotelError }, { data: profiles, error: profileError }] = await Promise.all([
    supabase.from("hotels").select("*").order("name"),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);
  if (hotelError) throw hotelError;
  if (profileError) throw profileError;
  return { hotels: hotels ?? [], profiles: profiles ?? [] };
}
