import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../auth/auth';
import { CHILD_COLORS, CURRENCIES } from '../lib/constants';

export function AuthScreen() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [family, setFamily] = useState('');
  const [currency, setCurrency] = useState('₺');
  const [firstChild, setFirstChild] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const reg = mode === 'register';
  const reset = mode === 'reset';

  function go(next: 'login' | 'register' | 'reset') {
    setMode(next); setErr(''); setSent(false);
  }

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

  async function sendReset() {
    setErr('');
    if (!email) { setErr('Please enter your email.'); return; }
    setBusy(true);
    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not send the reset email.');
    }
    setBusy(false);
  }

  return (
    <div className="app app--auth">
      <div className="auth">
        <div className="logo">Coursebook</div>
        <div className="tag">Your children's classes &amp; payments, in one calm place.</div>
        {err && <div className="err">{err}</div>}

        {reset ? (
          sent ? (
            <>
              <div className="tag" style={{ color: 'var(--green)' }}>
                If an account exists for {email}, a reset link is on its way — check your inbox.
              </div>
              <button className="btn primary" onClick={() => go('login')}>Back to sign in</button>
            </>
          ) : (
            <>
              <div className="field"><label>Email</label>
                <input type="email" autoComplete="username" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
              <button className="btn primary" disabled={busy} onClick={sendReset}>
                {busy ? 'Please wait…' : 'Send reset link'}
              </button>
              <div className="switch">Remembered it? <b onClick={() => go('login')}>Back to sign in</b></div>
            </>
          )
        ) : (
          <>
            {reg && (
              <div className="field"><label>Family name</label>
                <input value={family} onChange={(e) => setFamily(e.target.value)} placeholder="e.g. The Bakers" /></div>
            )}
            <div className="field"><label>Email</label>
              <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            <div className="field"><label>Password</label>
              <input type="password" autoComplete={reg ? 'new-password' : 'current-password'} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder={reg ? 'At least 6 characters' : '••••••••'} /></div>
            {!reg && (
              <div className="switch" style={{ marginTop: -2, marginBottom: 6, textAlign: 'right' }}>
                <b onClick={() => go('reset')}>Forgot password?</b>
              </div>
            )}
            {reg && (
              <div className="row2">
                <div className="field"><label>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c.code} value={c.symbol}>{c.label}</option>)}
                  </select></div>
                <div className="field"><label>First child (optional)</label>
                  <input value={firstChild} onChange={(e) => setFirstChild(e.target.value)} placeholder="e.g. Emma" /></div>
              </div>
            )}
            <button className="btn primary" disabled={busy} onClick={submit}>
              {busy ? 'Please wait…' : reg ? 'Create account' : 'Sign in'}
            </button>
            <div className="switch">
              {reg ? 'Already have an account? ' : 'New here? '}
              <b onClick={() => go(reg ? 'login' : 'register')}>{reg ? 'Sign in' : 'Create one'}</b>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
