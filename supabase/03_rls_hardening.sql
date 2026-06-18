-- ============================================================
-- RLS hardening — tighten write policies so a course/session can
-- only attach to a parent row the same user owns. Closes the gap
-- where a foreign key (child_id / course_id) could reference
-- another family's row (FKs are not filtered by RLS).
-- Safe to run after 01_schema.sql. Idempotent.
-- ============================================================

drop policy if exists "own courses" on public.courses;
create policy "own courses" on public.courses
  for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.children c
      where c.id = child_id and c.user_id = (select auth.uid())
    )
  );

drop policy if exists "own sessions" on public.sessions;
create policy "own sessions" on public.sessions
  for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.courses co
      where co.id = course_id and co.user_id = (select auth.uid())
    )
  );
