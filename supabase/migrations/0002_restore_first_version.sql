-- RECE — ritorno alla prima versione
-- Ripristina il ruolo "admin" e ricollega stepangrazi@gmail.com all'hotel Trevi.
-- Non cancella hotel, utenti, recensioni o configurazioni esistenti.

begin;

alter table public.profiles
  drop constraint if exists profiles_role_check;

do $$
declare
  trevi_hotel_id uuid;
begin
  select id
  into trevi_hotel_id
  from public.hotels
  where lower(name) = 'trevi' or lower(slug) = 'trevi'
  order by created_at asc
  limit 1;

  if trevi_hotel_id is null then
    raise exception 'Hotel Trevi non trovato: rollback interrotto senza modifiche.';
  end if;

  update public.profiles
  set role = 'admin'
  where role = 'platform_admin';

  update public.profiles
  set role = 'admin', hotel_id = trevi_hotel_id
  where lower(trim(email)) = 'stepangrazi@gmail.com';

  if not found then
    raise exception 'Profilo stepangrazi@gmail.com non trovato: rollback interrotto senza modifiche.';
  end if;
end;
$$;

alter table public.profiles
  alter column role set default 'hotel_user';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'hotel_user'));

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
    case
      when new.raw_user_meta_data->>'role' = 'admin' then 'admin'
      else 'hotel_user'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.current_hotel_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select hotel_id
  from public.profiles
  where id = auth.uid() and active = true;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

drop policy if exists "hotel visible to members" on public.hotels;
drop policy if exists "admins manage hotels" on public.hotels;
drop policy if exists "profiles visible to self or admin" on public.profiles;
drop policy if exists "admins manage profiles" on public.profiles;
drop policy if exists "members read integrations" on public.integrations;
drop policy if exists "members read reviews" on public.reviews;
drop policy if exists "members read drafts" on public.review_drafts;
drop policy if exists "members read knowledge" on public.knowledge_sources;
drop policy if exists "members read tone" on public.tone_profiles;
drop policy if exists "members read sync runs" on public.sync_runs;
drop policy if exists "server manages knowledge files" on storage.objects;

create policy "hotel visible to members"
on public.hotels for select
using (id = public.current_hotel_id() or public.is_platform_admin());

create policy "admins manage hotels"
on public.hotels for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "profiles visible to self or admin"
on public.profiles for select
using (id = auth.uid() or public.is_platform_admin());

create policy "admins manage profiles"
on public.profiles for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "members read integrations"
on public.integrations for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());

create policy "members read reviews"
on public.reviews for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());

create policy "members read drafts"
on public.review_drafts for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());

create policy "members read knowledge"
on public.knowledge_sources for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());

create policy "members read tone"
on public.tone_profiles for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());

create policy "members read sync runs"
on public.sync_runs for select
using (hotel_id = public.current_hotel_id() or public.is_platform_admin());

create policy "server manages knowledge files"
on storage.objects for select
using (
  bucket_id = 'knowledge-files'
  and (
    split_part(name, '/', 1) = public.current_hotel_id()::text
    or public.is_platform_admin()
  )
);

commit;
