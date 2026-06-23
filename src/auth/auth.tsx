import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// A password-reset link redirects back with the session in the URL and
// `type=recovery`. Supabase processes that URL as its client initializes and
// emits a one-time PASSWORD_RECOVERY event — which can fire BEFORE this
// provider's listener is attached, so relying on the event alone misses it and
// the app just shows the home screen. To be robust we also read the recovery
// intent straight from the URL here, at module load, before Supabase strips it.
function readRecoveryFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  return hash.get('type') === 'recovery' || query.get('type') === 'recovery';
}
const RECOVERY_FROM_URL = readRecoveryFromUrl();

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
  const [recovery, setRecovery] = useState(RECOVERY_FROM_URL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore any existing session on load (Supabase persists it for us).
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
      setEmail(data.session?.user?.email ?? null);
      setReady(true);
    });
    // Keep token + email in sync across login, logout, and silent token refreshes.
    // Also catch PASSWORD_RECOVERY if the listener happens to be attached in time
    // (the URL check above is the reliable path when it isn't).
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
