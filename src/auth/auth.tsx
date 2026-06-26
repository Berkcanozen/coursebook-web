import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthCtx {
  token: string | null;
  ready: boolean;
  signIn: (t: string) => void;
  signOut: () => void;
}
const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore any existing session on load (Supabase persists it for us).
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
      setReady(true);
    });
    // Keep token in sync across login, logout, and silent token refreshes.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // onAuthStateChange already sets the token after sign-in; setting it here too
  // just avoids a brief flash before the listener fires.
  const signIn = (t: string) => setToken(t);
  const signOut = () => { supabase.auth.signOut(); setToken(null); };

  return <Ctx.Provider value={{ token, ready, signIn, signOut }}>{children}</Ctx.Provider>;
}
