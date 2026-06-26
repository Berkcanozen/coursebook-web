// src/lib/api.ts
import { supabase } from './supabase';
import type {
  AuthResponse, Attendance, Child, Course, CourseInput, FamilyState, FeeType, Session, SessionInput,
} from '../types';
import type { Tables, TablesInsert, TablesUpdate } from './database.types';

// Kept so existing `import { ApiError }` (e.g. in AuthScreen) keeps working and
// `e instanceof ApiError` continues to surface the real error message.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

// No-op: Supabase manages the session itself, so there's no token to set
// manually. Kept only so any leftover `import { setAuthToken }` still resolves.
export const setAuthToken = (_t: string | null) => {};

// Throw on a Supabase error, otherwise return the data payload.
function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new ApiError(400, res.error.message);
  return res.data;
}

const byCreated = (a: { created_at?: string }, b: { created_at?: string }) =>
  (a.created_at ?? '').localeCompare(b.created_at ?? '');

// --- Schema-derived row shapes. The nested variants describe the embedded
// rows PostgREST returns for `select('*, courses(*, sessions(*))')`.
type SessionRow = Tables<'sessions'>;
type CourseRow = Tables<'courses'> & { sessions?: SessionRow[] | null };
type ChildRow = Tables<'children'> & { courses?: CourseRow[] | null };

// --- Postgres rows (snake_case) -> domain types (camelCase, what the UI reads)
const mapSession = (s: SessionRow): Session => ({
  id: s.id,
  date: s.date,                  // 'YYYY-MM-DD'
  amount: Number(s.amount) || 0, // numeric can arrive as a string; coerce
  paid: !!s.paid,
  note: s.note ?? '',
  attendance: (s.attendance ?? 'unknown') as Attendance,
});
const mapCourse = (c: CourseRow): Course => ({
  id: c.id,
  name: c.name,
  instructor: c.instructor ?? '',
  location: c.location ?? '',
  schedule: c.schedule ?? '',
  fee: Number(c.fee) || 0,
  feeType: c.fee_type as FeeType, // DB CHECK guarantees one of session/month/term
  icon: c.icon ?? 'other',
  sessions: (c.sessions ?? []).slice().sort(byCreated).map(mapSession),
});
const mapChild = (ch: ChildRow): Child => ({
  id: ch.id,
  name: ch.name,
  color: ch.color,
  courses: (ch.courses ?? []).slice().sort(byCreated).map(mapCourse),
});

// --- course inputs (camelCase) -> row (snake_case); only set provided keys
const toCourseRow = (d: Partial<CourseInput>): TablesUpdate<'courses'> => {
  const r: TablesUpdate<'courses'> = {};
  if (d.name !== undefined) r.name = d.name;
  if (d.instructor !== undefined) r.instructor = d.instructor;
  if (d.location !== undefined) r.location = d.location;
  if (d.schedule !== undefined) r.schedule = d.schedule;
  if (d.fee !== undefined) r.fee = d.fee;
  if (d.feeType !== undefined) r.fee_type = d.feeType;
  if (d.icon !== undefined) r.icon = d.icon;
  return r;
};

const CHILD_SELECT = '*, courses(*, sessions(*))';

export const api = {
  register: async (
    email: string, password: string, familyName: string, currency: string,
  ): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { family_name: familyName, currency } },
    });
    if (error) throw new ApiError(400, error.message);
    const token = data.session?.access_token;
    // No session => email confirmation is ON; the user must confirm first.
    if (!token) throw new ApiError(0, 'Account created. Please confirm your email, then sign in.');
    return { token, family: familyName, currency };
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(400, error.message);
    const token = data.session?.access_token;
    if (!token) throw new ApiError(0, 'Sign-in failed.');
    const profile = ok(
      await supabase.from('profiles').select('family_name, currency').maybeSingle(),
    );
    return { token, family: profile?.family_name ?? '', currency: profile?.currency ?? '\u20BA' };
  },

  // Sends a reset email; the link returns the user to this app's origin in a
  // temporary recovery session (handled by AuthProvider).
  requestPasswordReset: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw new ApiError(400, error.message);
  },

  // Sets a new password for the currently authenticated (or recovery) session.
  updatePassword: async (password: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new ApiError(400, error.message);
  },

  getState: async (): Promise<FamilyState> => {
    const [profileRes, childrenRes] = await Promise.all([
      supabase.from('profiles').select('*').maybeSingle(),
      supabase.from('children').select(CHILD_SELECT),
    ]);
    const profile = ok(profileRes);
    const children = (ok(childrenRes) ?? []) as ChildRow[];
    return {
      family: profile?.family_name ?? '',
      currency: profile?.currency ?? '\u20BA',
      maxRecurringSessions: profile?.max_recurring_sessions ?? 15,
      children: children.slice().sort(byCreated).map(mapChild),
    };
  },

  updateFamily: async (
    familyName: string, currency: string,
  ): Promise<{ family: string; currency: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, 'Not signed in.');
    const row = ok(
      await supabase.from('profiles')
        .update({ family_name: familyName, currency })
        .eq('id', user.id)
        .select('family_name, currency')
        .single(),
    ) as Tables<'profiles'>;
    return { family: row.family_name, currency: row.currency };
  },

  addChild: async (name: string, color: string): Promise<Child> =>
    mapChild(ok(await supabase.from('children')
      .insert({ name, color }).select(CHILD_SELECT).single()) as ChildRow),
  updateChild: async (id: string, patch: Partial<{ name: string; color: string }>): Promise<Child> =>
    mapChild(ok(await supabase.from('children')
      .update(patch).eq('id', id).select(CHILD_SELECT).single()) as ChildRow),
  deleteChild: async (id: string): Promise<void> => {
    ok(await supabase.from('children').delete().eq('id', id));
  },

  addCourse: async (childId: string, data: CourseInput): Promise<Course> =>
    mapCourse(ok(await supabase.from('courses')
      .insert({ child_id: childId, ...toCourseRow(data) } as TablesInsert<'courses'>)
      .select('*, sessions(*)').single()) as CourseRow),
  updateCourse: async (id: string, patch: Partial<CourseInput>): Promise<Course> =>
    mapCourse(ok(await supabase.from('courses')
      .update(toCourseRow(patch)).eq('id', id).select('*, sessions(*)').single()) as CourseRow),
  deleteCourse: async (id: string): Promise<void> => {
    ok(await supabase.from('courses').delete().eq('id', id));
  },

  addSession: async (courseId: string, data: SessionInput): Promise<Session> =>
    mapSession(ok(await supabase.from('sessions')
      .insert({ course_id: courseId, date: data.date, amount: data.amount, paid: data.paid, note: data.note })
      .select().single()) as SessionRow),
  // Batched insert — one round-trip for many sessions (e.g. a recurring run).
  addSessions: async (courseId: string, data: SessionInput[]): Promise<void> => {
    if (data.length === 0) return;
    const rows: TablesInsert<'sessions'>[] = data.map((d) => ({
      course_id: courseId, date: d.date, amount: d.amount, paid: d.paid, note: d.note,
    }));
    ok(await supabase.from('sessions').insert(rows));
  },
  updateSession: async (id: string, patch: Partial<SessionInput>): Promise<Session> =>
    mapSession(ok(await supabase.from('sessions').update(patch).eq('id', id).select().single()) as SessionRow),
  deleteSession: async (id: string): Promise<void> => {
    ok(await supabase.from('sessions').delete().eq('id', id));
  },
};
