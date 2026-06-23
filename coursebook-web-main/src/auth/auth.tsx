import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthCtx {
  token: string | null;
  email: string | null;
  ready: boolean;
  recovery: boolean;       // true while the user is here via a password-reset link
  signIn: (t: string) => void;
  signOut: () => void;
  endRecovery: () => void; // called once a new password has been set
}
const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [recovery, setRecovery] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore any existing session on load (Supabase persists it for us).
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
      setEmail(data.session?.user?.email ?? null);
      setReady(true);
    });
    // Keep token + email in sync across login, logout, and silent token refreshes.
    // A reset-password link arrives as a PASSWORD_RECOVERY event with a temporary
    // session — flag it so the app shows the "set new password" screen.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setToken(session?.access_token ?? null);
      setEmail(session?.user?.email ?? null);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // onAuthStateChange already sets these after sign-in; setting the token here
  // too just avoids a brief flash before the listener fires.
  const signIn = (t: string) => setToken(t);
  const signOut = () => { supabase.auth.signOut(); setToken(null); setEmail(null); setRecovery(false); };
  const endRecovery = () => setRecovery(false);

  return (
    <Ctx.Provider value={{ token, email, ready, recovery, signIn, signOut, endRecovery }}>
      {children}
    </Ctx.Provider>
  );
}
