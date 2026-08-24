-- RECE — recensioni inserite manualmente
-- Aggiunge il canale originale senza modificare recensioni o utenti esistenti.

begin;

alter table public.reviews
  add column if not exists original_channel text;

update public.reviews
set original_channel = coalesce(
  nullif(trim(raw_payload->>'original_channel'), ''),
  nullif(trim(raw_payload->>'channel'), ''),
  'Altro'
)
where provider = 'manual'
  and nullif(trim(original_channel), '') is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_manual_channel_check'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_manual_channel_check
      check (
        provider <> 'manual'
        or nullif(trim(original_channel), '') is not null
      );
  end if;
end;
$$;

comment on column public.reviews.original_channel is
  'Piattaforma originale indicata quando provider è manual.';

commit;
