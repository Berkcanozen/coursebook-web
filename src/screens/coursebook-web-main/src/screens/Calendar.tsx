import { useState } from 'react';
import type { FamilyState } from '../types';
import { money, fmtDate, todayISO } from '../lib/format';
import { useUi } from '../ui';
import { SessionSheet } from '../sheets/SessionSheet';

interface DaySession {
  id: string; date: string; amount: number; paid: boolean;
  courseName: string; childName: string; childColor: string;
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Calendar({ state }: { state: FamilyState }) {
  const ui = useUi();
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(todayISO());
  const t = todayISO();

  // Index every logged session by its date.
  const byDate: Record<string, DaySession[]> = {};
  state.children.forEach((c) =>
    c.courses.forEach((co) =>
      co.sessions.forEach((s) => {
        (byDate[s.date] = byDate[s.date] || []).push({
          id: s.id, date: s.date, amount: s.amount, paid: s.paid,
          courseName: co.name, childName: c.name, childColor: c.color,
        });
      })));

  const monthStart = new Date(view.year, view.month, 1);
  const monthLabel = monthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const offset = (monthStart.getDay() + 6) % 7; // Monday-first leading blanks
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  function dotColor(iso: string): string | null {
    const list = byDate[iso];
    if (!list || !list.length) return null;
    if (list.some((s) => !s.paid && s.date < t)) return 'var(--red)';
    if (list.some((s) => !s.paid)) return 'var(--amber)';
    return 'var(--green)';
  }

  function shift(delta: number) {
    const m = view.month + delta;
    const y = view.year + Math.floor(m / 12);
    setView({ year: y, month: ((m % 12) + 12) % 12 });
  }

  const selList = byDate[selected] || [];

  return (
    <div className="cal-layout">
      <div className="cal-main">
        <div className="cal-head">
          <button className="iconbtn ghost" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <div className="cal-title">{monthLabel}</div>
          <button className="iconbtn ghost" onClick={() => shift(1)} aria-label="Next month">›</button>
        </div>

        <div className="cal-grid cal-dow">
          {DOW.map((d) => <div key={d} className="dow">{d}</div>)}
        </div>

        <div className="cal-grid">
          {cells.map((iso, i) =>
            iso === null ? (
              <div key={i} className="cal-cell empty" />
            ) : (
              <button
                key={i}
                className={'cal-cell' + (iso === selected ? ' sel' : '') + (iso === t ? ' today' : '')}
                onClick={() => setSelected(iso)}
              >
                <span className="num">{Number(iso.slice(-2))}</span>
                {dotColor(iso) && <span className="cdot" style={{ background: dotColor(iso) as string }} />}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="cal-day">
        <div className="sechead" style={{ marginTop: 20 }}>
          <h2>{fmtDate(selected)}{selected === t ? ' · Today' : ''}</h2>
          <button className="link" onClick={() => ui.openSheet(<SessionSheet state={state} currency={state.currency} initialDate={selected} />)}>＋ Add session</button>
        </div>

        {selList.length === 0 ? (
          <div className="empty" style={{ padding: 24 }}><p>No sessions on this day.</p></div>
        ) : (
          selList.map((s) => {
            const over = !s.paid && s.date < t;
            const cls = s.paid ? 'paid' : over ? 'over' : 'due';
            const label = s.paid ? 'Paid' : over ? 'Overdue' : 'Unpaid';
            return (
              <div className="ses" key={s.id}>
                <div className="dt">
                  <span className="cdot" style={{ background: s.childColor, display: 'inline-block', marginRight: 7, verticalAlign: 'middle' }} />
                  {s.courseName} <small>{s.childName}</small>
                </div>
                <div className="rt">
                  <span className="amt">{money(state.currency, s.amount)}</span>
                  <span className={'pill ' + cls}>{label}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
