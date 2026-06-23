-- ============================================================
-- Currency fix — run this ONLY if you already ran the earlier
-- schema (the one with check (currency in ('TRY','USD','EUR'))).
-- It removes that constraint so the symbol the app sends (₺ / $ / €)
-- is accepted, and updates the signup default to match.
-- Safe to run more than once.
-- ============================================================

alter table public.profiles drop constraint if exists profiles_currency_check;
alter table public.profiles alter column currency set default '₺';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, family_name, currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'family_name', ''),
    coalesce(new.raw_user_meta_data ->> 'currency', '₺')
  );
  return new;
end;
$$;
