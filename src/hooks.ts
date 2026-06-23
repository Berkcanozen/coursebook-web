import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './lib/api';
import { useAuth } from './auth/auth';
import type { FamilyState } from './types';

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

// Immutably flip one session's paid flag inside the cached family tree.
function flipSessionPaid(state: FamilyState, sessionId: string, paid: boolean): FamilyState {
  return {
    ...state,
    children: state.children.map((ch) => ({
      ...ch,
      courses: ch.courses.map((co) =>
        co.sessions.some((s) => s.id === sessionId)
          ? { ...co, sessions: co.sessions.map((s) => (s.id === sessionId ? { ...s, paid } : s)) }
          : co),
    })),
  };
}

// Optimistic paid/unpaid toggle for a single session — the app's
// highest-frequency action. Instead of round-tripping the whole family tree
// (which feels laggy against a cold Supabase), it flips the boolean in the
// cache immediately, then reconciles with the server in the background and
// rolls back if the request fails.
export function useTogglePaid() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { id: string; paid: boolean }, { previous?: FamilyState }>({
    mutationFn: (p) => api.updateSession(p.id, { paid: p.paid }),
    onMutate: async (p) => {
      await qc.cancelQueries({ queryKey: ['state'] });
      const previous = qc.getQueryData<FamilyState>(['state']);
      if (previous) qc.setQueryData<FamilyState>(['state'], flipSessionPaid(previous, p.id, p.paid));
      return { previous };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.previous) qc.setQueryData(['state'], ctx.previous);
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['state'] }); },
  });
}
