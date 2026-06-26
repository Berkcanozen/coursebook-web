import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './lib/api';
import { useAuth } from './auth/auth';
import type { Attendance, FamilyState, Session, SessionInput } from './types';

export function useFamilyState() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['state'],
    queryFn: api.getState,
    enabled: !!token,
    // The whole family tree rarely changes out from under us, and mutations
    // already invalidate it. A short stale window stops needless full-tree
    // refetches on every remount / window refocus (costly against a cold DB).
    staleTime: 60_000,
  });
}

// Generic mutation that refreshes the cached family state on success.
// TArgs defaults to void so actions that take no arguments can call mutate()/mutateAsync() with none.
export function useAction<TArgs = void, TResult = unknown>(fn: (args: TArgs) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TArgs>({
    mutationFn: fn,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['state'] }); },
  });
}

// ---------------------------------------------------------------------------
// Optimistic helpers: apply a change to the cached family tree immediately,
// reconcile with the server in the background, roll back on error.
// ---------------------------------------------------------------------------
function patchSession(state: FamilyState, sessionId: string, patch: Partial<Session>): FamilyState {
  return {
    ...state,
    children: state.children.map((ch) => ({
      ...ch,
      courses: ch.courses.map((co) =>
        co.sessions.some((s) => s.id === sessionId)
          ? { ...co, sessions: co.sessions.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)) }
          : co),
    })),
  };
}
function addSessionToState(state: FamilyState, courseId: string, session: Session): FamilyState {
  return {
    ...state,
    children: state.children.map((ch) => ({
      ...ch,
      courses: ch.courses.map((co) => (co.id === courseId ? { ...co, sessions: [...co.sessions, session] } : co)),
    })),
  };
}
const removeCourse = (state: FamilyState, courseId: string): FamilyState => ({
  ...state,
  children: state.children.map((ch) => ({ ...ch, courses: ch.courses.filter((co) => co.id !== courseId) })),
});
const removeChild = (state: FamilyState, childId: string): FamilyState => ({
  ...state,
  children: state.children.filter((ch) => ch.id !== childId),
});

// Core machinery shared by every optimistic mutation in the app.
function useOptimisticTree<TArgs>(
  run: (args: TArgs) => Promise<unknown>,
  apply: (state: FamilyState, args: TArgs) => FamilyState,
) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, TArgs, { previous?: FamilyState }>({
    mutationFn: run,
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: ['state'] });
      const previous = qc.getQueryData<FamilyState>(['state']);
      if (previous) qc.setQueryData<FamilyState>(['state'], apply(previous, args));
      return { previous };
    },
    onError: (_e, _a, ctx) => { if (ctx?.previous) qc.setQueryData(['state'], ctx.previous); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['state'] }); },
  });
}

const tempId = () => 'temp-' + Math.random().toString(36).slice(2);

// Optimistic paid/unpaid toggle — the app's highest-frequency action.
export function useTogglePaid() {
  const m = useOptimisticTree<{ id: string; paid: boolean }>(
    (p) => api.updateSession(p.id, { paid: p.paid }),
    (state, p) => patchSession(state, p.id, { paid: p.paid }),
  );
  return m;
}

// Optimistic attendance setter (present / absent / cancelled / unknown).
export function useSetAttendance() {
  return useOptimisticTree<{ id: string; attendance: Attendance }>(
    (p) => api.updateSession(p.id, { attendance: p.attendance }),
    (state, p) => patchSession(state, p.id, { attendance: p.attendance }),
  );
}

// Optimistic single-session add: a placeholder appears instantly, then the
// background refetch swaps in the real row (with its server id).
export function useAddSession() {
  return useOptimisticTree<{ courseId: string; data: SessionInput }>(
    (p) => api.addSession(p.courseId, p.data),
    (state, p) => addSessionToState(state, p.courseId, {
      id: tempId(),
      date: p.data.date, amount: p.data.amount, paid: p.data.paid,
      note: p.data.note, attendance: p.data.attendance ?? 'unknown',
    }),
  );
}

// Optimistic deletes: the item disappears immediately; screens can navigate away
// without waiting on the round-trip.
export function useDeleteCourse() {
  return useOptimisticTree<string>((id) => api.deleteCourse(id), (state, id) => removeCourse(state, id));
}
export function useDeleteChild() {
  return useOptimisticTree<string>((id) => api.deleteChild(id), (state, id) => removeChild(state, id));
}
