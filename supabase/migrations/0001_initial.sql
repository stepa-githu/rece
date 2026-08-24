-- RECE — schema iniziale Supabase
-- Incolla questo file nel SQL Editor di Supabase ed eseguilo una sola volta.

create extension if not exists pgcrypto;

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  official_site_url text,
  default_language text not null default 'it',
  timezone text not null default 'Europe/Rome',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  hotel_id uuid references public.hotels(id) on delete set null,
  full_name text not null default '',
  email text not null,
  role text not null default 'hotel_user' check (role in ('admin', 'hotel_user')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  provider text not null check (provider in ('google', 'booking', 'tripadvisor', 'manual')),
  status text not null default 'disconnected' check (status in ('disconnected', 'pending_location', 'connected', 'error')),
  external_account_id text,
  external_location_id text,
  external_location_name text,
  available_locations jsonb not null default '[]'::jsonb,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, provider)
);

-- Nessuna policy client: contiene segreti cifrati e viene letta solo dal server.
create table if not exists public.integration_secrets (
  integration_id uuid primary key references public.integrations(id) on delete cascade,
  encrypted_credentials text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  provider text not null check (provider in ('google', 'booking', 'tripadvisor', 'manual')),
  original_channel text,
  external_id text not null,
  author_name text,
  author_country text,
  rating numeric(4,2),
  rating_scale numeric(4,2) not null default 5,
  title text,
  body text,
  positive_text text,
  negative_text text,
  language text,
  review_date timestamptz not null,
  source_url text,
  published_reply text,
  workflow_status text not null default 'new' check (workflow_status in ('new', 'drafted', 'handled', 'ignored')),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, provider, external_id),
  constraint reviews_manual_channel_check check (
    provider <> 'manual' or nullif(trim(original_channel), '') is not null
  )
);

create index if not exists reviews_hotel_date_idx
  on public.reviews (hotel_id, review_date desc);
create index if not exists reviews_hotel_status_idx
  on public.reviews (hotel_id, workflow_status);

create table if not exists public.review_drafts (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  generated_text text not null,
  edited_text text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'copied')),
  model text not null,
  prompt_version text not null default 'v1',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_drafts_review_date_idx
  on public.review_drafts (review_id, created_at desc);

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  source_type text not null check (source_type in ('website', 'file', 'text')),
  title text not null,
  source_url text,
  file_name text,
  storage_path text,
  mime_type text,
  extracted_text text not null default '',
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  character_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists knowledge_sources_hotel_url_unique
  on public.knowledge_sources (hotel_id, source_url)
  where source_url is not null;

create table if not exists public.tone_profiles (
  hotel_id uuid primary key references public.hotels(id) on delete cascade,
  formality smallint not null default 3 check (formality between 1 and 5),
  warmth smallint not null default 4 check (warmth between 1 and 5),
  concision smallint not null default 4 check (concision between 1 and 5),
  greeting_style text not null default 'Nome dell''ospite, quando presente',
  signature text not null default 'Lo staff della struttura',
  preferred_words text not null default '',
  forbidden_words text not null default '',
  extra_instructions text not null default '',
  example_replies text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  integration_id uuid references public.integrations(id) on delete set null,
  provider text not null,
  status text not null check (status in ('running', 'success', 'error')),
  imported_count integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hotels_set_updated_at on public.hotels;
create trigger hotels_set_updated_at before update on public.hotels
for each row execute function public.set_updated_at();
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists integrations_set_updated_at on public.integrations;
create trigger integrations_set_updated_at before update on public.integrations
for each row execute function public.set_updated_at();
drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();
drop trigger if exists review_drafts_set_updated_at on public.review_drafts;
create trigger review_drafts_set_updated_at before update on public.review_drafts
for each row execute function public.set_updated_at();
drop trigger if exists knowledge_sources_set_updated_at on public.knowledge_sources;
create trigger knowledge_sources_set_updated_at before update on public.knowledge_sources
for each row execute function public.set_updated_at();
drop trigger if exists tone_profiles_set_updated_at on public.tone_profiles;
create trigger tone_profiles_set_updated_at before update on public.tone_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, hotel_id, full_name, email, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'hotel_id', '')::uuid,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    case when new.raw_user_meta_data->>'role' = 'admin' then 'admin' else 'hotel_user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_hotel_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select hotel_id from public.profiles where id = auth.uid() and active = true;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

alter table public.hotels enable row level security;
alter table public.profiles enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_secrets enable row level security;
alter table public.reviews enable row level security;
alter table public.review_drafts enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.tone_profiles enable row level security;
alter table public.sync_runs enable row level security;

create policy "hotel visible to members" on public.hotels for select
using (id = public.current_hotel_id() or public.is_platform_admin());
create policy "admins manage hotels" on public.hotels for all
using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "profiles visible to self or admin" on public.profiles for select
using (id = auth.uid() or public.is_platform_admin());
create policy "admins manage profiles" on public.profiles for all
using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "members read integrations" on public.integrations for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());
create policy "members read reviews" on public.reviews for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());
create policy "members read drafts" on public.review_drafts for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());
create policy "members read knowledge" on public.knowledge_sources for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());
create policy "members read tone" on public.tone_profiles for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());
create policy "members read sync runs" on public.sync_runs for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());

insert into storage.buckets (id, name, public)
values ('knowledge-files', 'knowledge-files', false)
on conflict (id) do nothing;

create policy "server manages knowledge files"
on storage.objects for select
using (
  bucket_id = 'knowledge-files'
  and (
    split_part(name, '/', 1) = public.current_hotel_id()::text
    or public.is_platform_admin()
  )
);
