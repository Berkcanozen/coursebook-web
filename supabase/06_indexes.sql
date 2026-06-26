-- supabase/06_indexes.sql
-- Postgres does not auto-index foreign-key columns. The nested family fetch
-- joins on them and RLS filters on user_id, so these indexes keep reads fast as
-- sessions accumulate over months. Safe and idempotent — run anytime.

create index if not exists idx_sessions_course_id on public.sessions (course_id);
create index if not exists idx_sessions_user_id   on public.sessions (user_id);
create index if not exists idx_courses_child_id   on public.courses  (child_id);
create index if not exists idx_courses_user_id    on public.courses  (user_id);
create index if not exists idx_children_user_id   on public.children (user_id);
