import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../auth/auth';
import { CHILD_COLORS } from '../lib/constants';

export function AuthScreen() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [family, setFamily] = useState('');
  const [currency, setCurrency] = useState('€');
  const [firstChild, setFirstChild] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const reg = mode === 'register';

  async function submit() {
    setErr('');
    if (!email || !password) { setErr('Please enter your email and password.'); return; }
    if (reg && !family) { setErr('Please enter a family name.'); return; }
    setBusy(true);
    try {
      const res = reg
        ? await api.register(email, password, family, currency || '€')
        : await api.login(email, password);
      signIn(res.token);
      if (reg && firstChild.trim()) await api.addChild(firstChild.trim(), CHILD_COLORS[0]);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not sign in.');
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <div className="auth">
        <div className="logo">Coursebook</div>
        <div className="tag">Your children's classes &amp; payments, in one calm place.</div>
        {err && <div className="err">{err}</div>}
        {reg && (
          <div className="field"><label>Family name</label>
            <input value={family} onChange={(e) => setFamily(e.target.value)} placeholder="e.g. The Bakers" /></div>
        )}
        <div className="field"><label>Email</label>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div className="field"><label>Password</label>
          <input type="password" autoComplete={reg ? 'new-password' : 'current-password'} value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder={reg ? 'At least 6 characters' : '••••••••'} /></div>
        {reg && (
          <div className="row2">
            <div className="field"><label>Currency</label>
              <input value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value)} /></div>
            <div className="field"><label>First child (optional)</label>
              <input value={firstChild} onChange={(e) => setFirstChild(e.target.value)} placeholder="e.g. Emma" /></div>
          </div>
        )}
        <button className="btn primary" disabled={busy} onClick={submit}>
          {busy ? 'Please wait…' : reg ? 'Create account' : 'Sign in'}
        </button>
        <div className="switch">
          {reg ? 'Already have an account? ' : 'New here? '}
          <b onClick={() => { setMode(reg ? 'login' : 'register'); setErr(''); }}>{reg ? 'Sign in' : 'Create one'}</b>
        </div>
      </div>
    </div>
  );
}
