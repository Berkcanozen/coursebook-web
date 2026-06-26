import type { Child, Course, FamilyState, Session } from '../types';

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const isoBack = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); };

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

// ---- recurrence + attention helpers ----

export const isoFwd = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
};

// Local-safe ISO (avoids the UTC day-shift that toISOString can cause).
const localISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Every date in [startISO, endISO] whose weekday is in `weekdays` (0=Sun..6=Sat).
export function genDates(startISO: string, endISO: string, weekdays: number[]): string[] {
  if (!startISO || !endISO || weekdays.length === 0) return [];
  const start = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  if (end < start) return [];
  const out: string[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (weekdays.includes(d.getDay())) out.push(localISO(d));
  }
  return out;
}

export interface SessionRef { childName: string; childColor: string; course: Course; session: Session; }

export function flatSessions(s: FamilyState): SessionRef[] {
  const out: SessionRef[] = [];
  s.children.forEach((ch) =>
    ch.courses.forEach((co) =>
      co.sessions.forEach((se) =>
        out.push({ childName: ch.name, childColor: ch.color, course: co, session: se }))));
  return out;
}

export function overdueRefs(s: FamilyState): SessionRef[] {
  const t = todayISO();
  return flatSessions(s)
    .filter((r) => !r.session.paid && r.session.date < t)
    .sort((a, b) => a.session.date.localeCompare(b.session.date));
}

export function upcomingRefs(s: FamilyState, days = 7): SessionRef[] {
  const t = todayISO();
  const end = isoFwd(days);
  return flatSessions(s)
    .filter((r) => r.session.date >= t && r.session.date <= end)
    .sort((a, b) => a.session.date.localeCompare(b.session.date));
}
