import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './lib/api';
import { useAuth } from './auth/auth';

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
