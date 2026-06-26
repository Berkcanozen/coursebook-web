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

// Paid/unpaid toggle with an optimistic cache update: the pill flips instantly,
// rolls back if the request fails, and reconciles with the server on settle.
export function useToggleSessionPaid() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { id: string; paid: boolean }, { prev?: FamilyState }>({
    mutationFn: ({ id, paid }) => api.updateSession(id, { paid }),
    onMutate: async ({ id, paid }) => {
      await qc.cancelQueries({ queryKey: ['state'] });
      const prev = qc.getQueryData<FamilyState>(['state']);
      if (prev) {
        qc.setQueryData<FamilyState>(['state'], {
          ...prev,
          children: prev.children.map((ch) => ({
            ...ch,
            courses: ch.courses.map((co) => ({
              ...co,
              sessions: co.sessions.map((s) => (s.id === id ? { ...s, paid } : s)),
            })),
          })),
        });
      }
      return { prev };
    },
    onError: (_e, _vars, ctx) => { if (ctx?.prev) qc.setQueryData(['state'], ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['state'] }); },
  });
}
