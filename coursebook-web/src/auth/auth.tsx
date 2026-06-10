import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setAuthToken } from '../lib/api';

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

const KEY = 'coursebook_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(KEY);
    if (t) { setAuthToken(t); setToken(t); }
    setReady(true);
  }, []);

  const signIn = (t: string) => { localStorage.setItem(KEY, t); setAuthToken(t); setToken(t); };
  const signOut = () => { localStorage.removeItem(KEY); setAuthToken(null); setToken(null); };

  return <Ctx.Provider value={{ token, ready, signIn, signOut }}>{children}</Ctx.Provider>;
}
