-- supabase/04_attendance.sql
-- Adds per-session attendance tracking.
-- Run this in the Supabase dashboard SQL editor.

alter table public.sessions
  add column if not exists attendance text not null default 'unknown';

-- Constrain to the known states (idempotent).
alter table public.sessions
  drop constraint if exists sessions_attendance_check;

alter table public.sessions
  add constraint sessions_attendance_check
  check (attendance in ('unknown', 'present', 'absent', 'cancelled'));
