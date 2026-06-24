import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './lib/api';
import { useAuth } from './auth/auth';
import type { Attendance, FamilyState, Session } from './types';

export function useFamilyState() {
  const { token } = useAuth();
  return useQuery({ queryKey: ['state'], queryFn: api.getState, enabled: !!token });
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

// Immutably merge a patch into one session inside the cached family tree.
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

// Shared optimistic-update machinery: write `patch` into the cached session
// straight away, reconcile with the server in the background, roll back on error.
function useOptimisticSession<V>(
  run: (id: string, value: V) => Promise<unknown>,
  toPatch: (value: V) => Partial<Session>,
) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { id: string; value: V }, { previous?: FamilyState }>({
    mutationFn: (p) => run(p.id, p.value),
    onMutate: async (p) => {
      await qc.cancelQueries({ queryKey: ['state'] });
      const previous = qc.getQueryData<FamilyState>(['state']);
      if (previous) qc.setQueryData<FamilyState>(['state'], patchSession(previous, p.id, toPatch(p.value)));
      return { previous };
    },
    onError: (_e, _p, ctx) => { if (ctx?.previous) qc.setQueryData(['state'], ctx.previous); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['state'] }); },
  });
}

// Optimistic paid/unpaid toggle — the app's highest-frequency action.
export function useTogglePaid() {
  const m = useOptimisticSession<boolean>(
    (id, paid) => api.updateSession(id, { paid }),
    (paid) => ({ paid }),
  );
  return { ...m, mutate: (p: { id: string; paid: boolean }) => m.mutate({ id: p.id, value: p.paid }) };
}

// Optimistic attendance setter (present / absent / cancelled / unknown).
export function useSetAttendance() {
  const m = useOptimisticSession<Attendance>(
    (id, attendance) => api.updateSession(id, { attendance }),
    (attendance) => ({ attendance }),
  );
  return { ...m, mutate: (p: { id: string; attendance: Attendance }) => m.mutate({ id: p.id, value: p.attendance }) };
}
