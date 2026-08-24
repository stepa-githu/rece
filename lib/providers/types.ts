import type { ReviewProvider } from "@/types";

export interface NormalizedReview {
  provider: ReviewProvider;
  external_id: string;
  author_name: string | null;
  author_country: string | null;
  rating: number | null;
  rating_scale: number;
  title: string | null;
  body: string | null;
  positive_text: string | null;
  negative_text: string | null;
  language: string | null;
  review_date: string;
  source_url: string | null;
  published_reply: string | null;
  raw_payload: Record<string, unknown>;
}

export interface ProviderCredentials extends Record<string, unknown> {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  apiKey?: string;
}
