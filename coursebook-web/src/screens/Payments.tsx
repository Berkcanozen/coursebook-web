import type { FamilyState } from '../types';
import { useUi, type PayFilter } from '../ui';
import { fmtDate, fmtMonth, money, outstanding, paidThisYear, todayISO } from '../lib/format';

interface Row { id: string; date: string; amount: number; paid: boolean; courseName: string; childName: string; }

export function Payments({ state }: { state: FamilyState }) {
  const ui = useUi();
  const year = new Date().getFullYear();

  const all: Row[] = [];
  state.children.forEach((c) => c.courses.forEach((co) => co.sessions.forEach((s) =>
    all.push({ id: s.id, date: s.date, amount: s.amount, paid: s.paid, courseName: co.name, childName: c.name }))));
  all.sort((a, b) => b.date.localeCompare(a.date));

  const f = ui.payFilter;
  const filtered = all.filter((s) => (f === 'all' ? true : f === 'unpaid' ? !s.paid : s.paid));
  const total = filtered.reduce((t, s) => t + (s.amount || 0), 0);

  const groups: Record<string, Row[]> = {};
  filtered.forEach((s) => { const k = s.date.slice(0, 7); (groups[k] = groups[k] || []).push(s); });
  const keys = Object.keys(groups).sort().reverse();

  return (
    <>
      <div className="summary" style={{ marginTop: 8 }}>
        <div className="stat due"><div className="lbl">Outstanding</div><div className="val">{money(state.currency, outstanding(state))}</div></div>
        <div className="stat paid"><div className="lbl">Paid in {year}</div><div className="val">{money(state.currency, paidThisYear(state))}</div></div>
      </div>

      <div className="filterbar">
        {(['all', 'unpaid', 'paid'] as PayFilter[]).map((x) => (
          <button key={x} className={'f' + (f === x ? ' on' : '')} onClick={() => ui.setPayFilter(x)}>
            {x[0].toUpperCase() + x.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, margin: '0 2px 4px' }}>
        {filtered.length} {f === 'all' ? 'sessions' : f} · {money(state.currency, total)}
      </div>

      {filtered.length === 0 ? (
        <div className="empty" style={{ padding: 30 }}><p>Nothing here yet.</p></div>
      ) : (
        keys.map((k) => {
          const items = groups[k];
          const gt = items.reduce((t, s) => t + (s.amount || 0), 0);
          return (
            <div className="pay-group" key={k}>
              <div className="gh"><span className="t">{fmtMonth(k + '-01')}</span><span className="s">{money(state.currency, gt)}</span></div>
              {items.map((s) => {
                const over = !s.paid && s.date < todayISO();
                const cls = s.paid ? 'paid' : over ? 'over' : 'due';
                const label = s.paid ? 'Paid' : over ? 'Overdue' : 'Unpaid';
                return (
                  <div className="ses" key={s.id}>
                    <div className="dt">{s.courseName} <small>{s.childName} · {fmtDate(s.date)}</small></div>
                    <div className="rt"><span className="amt">{money(state.currency, s.amount)}</span><span className={'pill ' + cls}>{label}</span></div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </>
  );
}
