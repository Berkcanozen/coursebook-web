import type {
  AuthResponse, Child, Course, CourseInput, FamilyState, Session, SessionInput,
} from '../types';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api';

let token: string | null = null;
export function setAuthToken(t: string | null) { token = t; }

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Cannot reach the server at ${BASE.replace('/api', '')}. Is the backend running?`);
  }
  if (res.status === 204) return undefined as T;
  let data: unknown = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error || `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const api = {
  register: (email: string, password: string, familyName: string, currency: string) =>
    req<AuthResponse>('POST', '/auth/register', { email, password, familyName, currency }),
  login: (email: string, password: string) =>
    req<AuthResponse>('POST', '/auth/login', { email, password }),

  getState: () => req<FamilyState>('GET', '/me/state'),
  updateFamily: (familyName: string, currency: string) =>
    req<{ family: string; currency: string }>('PATCH', '/me', { familyName, currency }),

  addChild: (name: string, color: string) => req<Child>('POST', '/children', { name, color }),
  updateChild: (id: string, patch: Partial<{ name: string; color: string }>) =>
    req<Child>('PATCH', '/children/' + id, patch),
  deleteChild: (id: string) => req<void>('DELETE', '/children/' + id),

  addCourse: (childId: string, data: CourseInput) => req<Course>('POST', '/courses', { childId, ...data }),
  updateCourse: (id: string, patch: Partial<CourseInput>) => req<Course>('PATCH', '/courses/' + id, patch),
  deleteCourse: (id: string) => req<void>('DELETE', '/courses/' + id),

  addSession: (courseId: string, data: SessionInput) => req<Session>('POST', '/courses/' + courseId + '/sessions', data),
  updateSession: (id: string, patch: Partial<SessionInput>) => req<Session>('PATCH', '/sessions/' + id, patch),
  deleteSession: (id: string) => req<void>('DELETE', '/sessions/' + id),
};
