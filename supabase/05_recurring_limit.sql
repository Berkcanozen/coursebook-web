-- supabase/05_recurring_limit.sql
-- Makes the recurring-session cap a DB parameter (default 15) instead of a
-- hard-coded constant. Change it per family in the dashboard; the app reads it.
-- Run this in the Supabase dashboard SQL editor.

alter table public.profiles
  add column if not exists max_recurring_sessions int not null default 15;

alter table public.profiles
  drop constraint if exists profiles_max_recurring_sessions_check;

alter table public.profiles
  add constraint profiles_max_recurring_sessions_check
  check (max_recurring_sessions between 1 and 365);
