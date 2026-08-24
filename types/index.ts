export type AppRole = "admin" | "hotel_user";
export type ReviewProvider = "google" | "booking" | "tripadvisor" | "manual";
export type IntegrationStatus =
  | "disconnected"
  | "pending_location"
  | "connected"
  | "error";

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  official_site_url: string | null;
  default_language: string;
  timezone: string;
  active: boolean;
  created_at?: string;
}

export interface Profile {
  id: string;
  hotel_id: string | null;
  full_name: string;
  email: string;
  role: AppRole;
  active: boolean;
}

export interface AppContext {
  user: { id: string; email: string };
  profile: Profile;
  hotel: Hotel | null;
  demo: boolean;
}

export interface ReviewDraft {
  id: string;
  review_id: string;
  generated_text: string;
  edited_text: string | null;
  status: "draft" | "approved" | "copied";
  model: string;
  created_at: string;
}

export interface Review {
  id: string;
  hotel_id: string;
  provider: ReviewProvider;
  original_channel: string | null;
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
  workflow_status: "new" | "drafted" | "handled" | "ignored";
  latest_draft?: ReviewDraft | null;
  created_at?: string;
}

export interface KnowledgeSource {
  id: string;
  hotel_id: string;
  source_type: "website" | "file" | "text";
  title: string;
  source_url: string | null;
  file_name: string | null;
  status: "processing" | "ready" | "error";
  character_count: number;
  error_message: string | null;
  updated_at: string;
}

export interface ToneProfile {
  hotel_id: string;
  formality: number;
  warmth: number;
  concision: number;
  greeting_style: string;
  signature: string;
  preferred_words: string;
  forbidden_words: string;
  extra_instructions: string;
  example_replies: string;
}

export interface Integration {
  id: string;
  hotel_id: string;
  provider: ReviewProvider;
  status: IntegrationStatus;
  external_account_id: string | null;
  external_location_id: string | null;
  external_location_name: string | null;
  available_locations: Array<{
    accountId: string;
    locationId: string;
    name: string;
  }>;
  last_synced_at: string | null;
  last_error: string | null;
}
