-- ============================================================
-- Coursebook — Supabase (Postgres) schema + Auth + RLS
-- Canonical version. Run on a FRESH project:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- If you already ran the earlier schema, run db/02_currency_fix.sql instead.
-- No data migration needed (Render SQLite was ephemeral).
-- ============================================================

-- 1. PROFILES — replaces the family columns of the old `users` table.
-- currency stores the symbol the UI uses (₺ / $ / €), not a code.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  family_name text not null default '',
  currency    text not null default '₺',
  created_at  timestamptz not null default now()
);

-- 2. Auto-create a profile when a user signs up.
create function public.handle_new_user()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. CHILDREN — user_id defaults to auth.uid(), so the client never sends it.
create table public.children (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#C85A38',
  created_at timestamptz not null default now()
);
create index idx_children_user on public.children(user_id);

-- 4. COURSES
create table public.courses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  name       text not null,
  instructor text not null default '',
  location   text not null default '',
  schedule   text not null default '',
  fee        numeric not null default 0,
  fee_type   text not null default 'session' check (fee_type in ('session','month','term')),
  icon       text not null default 'other',
  created_at timestamptz not null default now()
);
create index idx_courses_child on public.courses(child_id);
create index idx_courses_user  on public.courses(user_id);

-- 5. SESSIONS
create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  date       date not null,
  amount     numeric not null default 0,
  paid       boolean not null default false,
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index idx_sessions_course on public.sessions(course_id);
create index idx_sessions_user   on public.sessions(user_id);

-- 6. ROW LEVEL SECURITY — each family sees only its own rows.
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.courses  enable row level security;
alter table public.sessions enable row level security;

create policy "own profile - select" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "own profile - update" on public.profiles
  for update using ((select auth.uid()) = id);

create policy "own children" on public.children
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own courses" on public.courses
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own sessions" on public.sessions
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 7. GRANTS — required for the Data API to reach these tables (RLS still
-- governs which rows). New Supabase projects need these explicitly.
grant usage on schema public to authenticated;
grant select, insert, update, delete
  on public.profiles, public.children, public.courses, public.sessions
  to authenticated;
