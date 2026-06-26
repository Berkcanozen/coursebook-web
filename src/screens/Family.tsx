import type { FamilyState } from '../types';
import { useUi } from '../ui';
import { useAuth } from '../auth/auth';
import { money } from '../lib/format';
import { ChildSheet } from '../sheets/ChildSheet';
import { SettingsSheet } from '../sheets/SettingsSheet';

export function Family({ state }: { state: FamilyState }) {
  const ui = useUi();
  const { signOut } = useAuth();

  return (
    <>
      <div style={{ margin: '4px 0 16px' }}>
        {state.children.length === 0 ? (
          <div className="empty"><p>No children yet.</p></div>
        ) : (
          state.children.map((c) => {
            const due = c.courses.reduce((t, co) => t + co.sessions.reduce((a, s) => a + (s.paid ? 0 : s.amount || 0), 0), 0);
            return (
              <button key={c.id} className="fam-row" onClick={() => ui.openSheet(<ChildSheet existing={c} />)}>
                <div className="av" style={{ background: c.color }}>{c.name.slice(0, 1).toUpperCase()}</div>
                <div className="nm">{c.name}
                  <div className="ct">{c.courses.length} course{c.courses.length !== 1 ? 's' : ''}{due ? ` · ${money(state.currency, due)} due` : ''}</div>
                </div>
                <span style={{ color: 'var(--faint)', fontSize: 18 }}>✎</span>
              </button>
            );
          })
        )}
      </div>
      <button className="btn soft" onClick={() => ui.openSheet(<ChildSheet />)}>＋ Add a child</button>

      <div style={{ marginTop: 28, fontSize: 12, color: 'var(--muted)', fontWeight: 600, padding: '0 2px 8px' }}>ACCOUNT</div>
      <div className="meta">
        <button className="r" style={{ cursor: 'pointer', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--line)' }}
          onClick={() => ui.openSheet(<SettingsSheet family={state.family} currency={state.currency} />)}>
          <span className="i">🏷️</span><span className="k" style={{ textAlign: 'left' }}>Family name</span><span className="v">{state.family || '—'}</span>
        </button>
        <button className="r" style={{ cursor: 'pointer', width: '100%', background: 'none', border: 'none' }}
          onClick={() => ui.openSheet(<SettingsSheet family={state.family} currency={state.currency} />)}>
          <span className="i">💱</span><span className="k" style={{ textAlign: 'left' }}>Currency</span><span className="v">{state.currency}</span>
        </button>
      </div>

      <button className="btn danger" style={{ marginTop: 16 }}
        onClick={() => { if (confirm('Sign out of Coursebook?')) signOut(); }}>Sign out</button>
    </>
  );
}
