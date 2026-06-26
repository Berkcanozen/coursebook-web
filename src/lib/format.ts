import type { Child, Course, FamilyState, Session } from '../types';

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const isoBack = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); };

// Local-date helpers for recurring generation. We build the YYYY-MM-DD string
// from local parts (not toISOString) so dates don't shift a day in +UTC zones.
const localISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ISO date `days` days ahead of today.
export const isoFwd = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return localISO(d); };

// Every date between `start` and `end` (inclusive) whose weekday is in
// `weekdays` (0 = Sun … 6 = Sat, matching Date.getDay()).
export function genDates(start: string, end: string, weekdays: number[]): string[] {
  if (!start || !end || weekdays.length === 0) return [];
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return [];
  const out: string[] = [];
  const d = new Date(s);
  let guard = 0;
  while (d <= e && guard < 1000) {
    if (weekdays.includes(d.getDay())) out.push(localISO(d));
    d.setDate(d.getDate() + 1);
    guard++;
  }
  return out;
}

export const money = (currency: string, n: number) =>
  currency + Number(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const fmtDate = (iso: string) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
export const fmtMonth = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export const latestSession = (c: Course): Session | null =>
  c.sessions.length ? [...c.sessions].sort((a, b) => b.date.localeCompare(a.date))[0] : null;

export type Status = 'paid' | 'due' | 'over' | 'none';
export const courseStatus = (c: Course): Status => {
  const ls = latestSession(c);
  if (!ls) return 'none';
  if (ls.paid) return 'paid';
  return ls.date < todayISO() ? 'over' : 'due';
};
export const PILL: Record<Status, [string, string]> = {
  paid: ['paid', 'Paid'], due: ['due', 'Unpaid'], over: ['over', 'Overdue'], none: ['none', 'No sessions'],
};

export const outstanding = (s: FamilyState) => {
  let t = 0;
  s.children.forEach((c) => c.courses.forEach((co) => co.sessions.forEach((x) => { if (!x.paid) t += x.amount || 0; })));
  return t;
};
export const paidThisYear = (s: FamilyState) => {
  const y = String(new Date().getFullYear());
  let t = 0;
  s.children.forEach((c) => c.courses.forEach((co) => co.sessions.forEach((x) => { if (x.paid && x.date.slice(0, 4) === y) t += x.amount || 0; })));
  return t;
};

export function findCourse(s: FamilyState, courseId: string): { child: Child; course: Course } | null {
  for (const child of s.children) {
    const course = child.courses.find((c) => c.id === courseId);
    if (course) return { child, course };
  }
  return null;
}
