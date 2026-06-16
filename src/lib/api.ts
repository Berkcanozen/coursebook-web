// src/lib/api.ts
import { supabase } from './supabase';
import type {
  AuthResponse, Child, Course, CourseInput, FamilyState, Session, SessionInput,
} from '../types';

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

// --- Postgres rows (snake_case) -> domain types (camelCase, what the UI reads)
const mapSession = (s: any): Session => ({
  id: s.id,
  date: s.date,                  // 'YYYY-MM-DD'
  amount: Number(s.amount) || 0, // numeric can arrive as a string; coerce
  paid: !!s.paid,
  note: s.note ?? '',
});
const mapCourse = (c: any): Course => ({
  id: c.id,
  name: c.name,
  instructor: c.instructor ?? '',
  location: c.location ?? '',
  schedule: c.schedule ?? '',
  fee: Number(c.fee) || 0,
  feeType: c.fee_type,
  icon: c.icon ?? 'other',
  sessions: (c.sessions ?? []).slice().sort(byCreated).map(mapSession),
});
const mapChild = (ch: any): Child => ({
  id: ch.id,
  name: ch.name,
  color: ch.color,
  courses: (ch.courses ?? []).slice().sort(byCreated).map(mapCourse),
});

// --- course inputs (camelCase) -> row (snake_case); only set provided keys
const toCourseRow = (d: Partial<CourseInput>) => {
  const r: Record<string, unknown> = {};
  if (d.name !== undefined) r.name = d.name;
  if (d.instructor !== undefined) r.instructor = d.instructor;
  if (d.location !== undefined) r.location = d.location;
  if (d.schedule !== undefined) r.schedule = d.schedule;
  if (d.fee !== undefined) r.fee = d.fee;
  if (d.feeType !== undefined) r.fee_type = d.feeType;
  if (d.icon !== undefined) r.icon = d.icon;
  return r;
};

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

  getState: async (): Promise<FamilyState> => {
    const [profileRes, childrenRes] = await Promise.all([
      supabase.from('profiles').select('family_name, currency').maybeSingle(),
      supabase.from('children').select('*, courses(*, sessions(*))'),
    ]);
    const profile = ok(profileRes);
    const children = (ok(childrenRes) ?? []) as any[];
    return {
      family: profile?.family_name ?? '',
      currency: profile?.currency ?? '\u20BA',
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
    ) as { family_name: string; currency: string };
    return { family: row.family_name, currency: row.currency };
  },

  addChild: async (name: string, color: string): Promise<Child> =>
    mapChild(ok(await supabase.from('children')
      .insert({ name, color }).select('*, courses(*, sessions(*))').single())),
  updateChild: async (id: string, patch: Partial<{ name: string; color: string }>): Promise<Child> =>
    mapChild(ok(await supabase.from('children')
      .update(patch).eq('id', id).select('*, courses(*, sessions(*))').single())),
  deleteChild: async (id: string): Promise<void> => {
    ok(await supabase.from('children').delete().eq('id', id));
  },

  addCourse: async (childId: string, data: CourseInput): Promise<Course> =>
    mapCourse(ok(await supabase.from('courses')
      .insert({ child_id: childId, ...toCourseRow(data) }).select('*, sessions(*)').single())),
  updateCourse: async (id: string, patch: Partial<CourseInput>): Promise<Course> =>
    mapCourse(ok(await supabase.from('courses')
      .update(toCourseRow(patch)).eq('id', id).select('*, sessions(*)').single())),
  deleteCourse: async (id: string): Promise<void> => {
    ok(await supabase.from('courses').delete().eq('id', id));
  },

  addSession: async (courseId: string, data: SessionInput): Promise<Session> =>
    mapSession(ok(await supabase.from('sessions')
      .insert({ course_id: courseId, date: data.date, amount: data.amount, paid: data.paid, note: data.note })
      .select().single())),
  updateSession: async (id: string, patch: Partial<SessionInput>): Promise<Session> =>
    mapSession(ok(await supabase.from('sessions').update(patch).eq('id', id).select().single())),
  deleteSession: async (id: string): Promise<void> => {
    ok(await supabase.from('sessions').delete().eq('id', id));
  },
};
