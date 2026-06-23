import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../auth/auth';

// Shown when the user arrives via a password-reset email link. At this point
// Supabase has put them in a temporary recovery session, so updateUser can set
// a fresh password; once it's set we drop recovery mode and they're signed in.
export function ResetPassword() {
  const { endRecovery, email } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setErr('');
    if (password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setErr('The two passwords don’t match.'); return; }
    setBusy(true);
    try {
      await api.updatePassword(password);
      setDone(true);
      setTimeout(endRecovery, 1200);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not update your password.');
      setBusy(false);
    }
  }

  return (
    <div className="app app--auth">
      <div className="auth">
        <div className="logo">Coursebook</div>
        <div className="tag">Choose a new password{email ? ` for ${email}` : ''}.</div>
        {err && <div className="err">{err}</div>}
        {done ? (
          <div className="tag" style={{ color: 'var(--green)' }}>Password updated. Taking you in…</div>
        ) : (
          <>
            <div className="field"><label>New password</label>
              <input type="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></div>
            <div className="field"><label>Confirm password</label>
              <input type="password" autoComplete="new-password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" /></div>
            <button className="btn primary" disabled={busy} onClick={submit}>
              {busy ? 'Please wait…' : 'Update password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
