import { useState } from 'react';
import type { Course } from '../types';
import { useUi } from '../ui';
import { useAction } from '../hooks';
import { api } from '../lib/api';
import { todayISO, isoFwd, genDates } from '../lib/format';

const WEEKDAYS: { label: string; day: number }[] = [
  { label: 'Mon', day: 1 }, { label: 'Tue', day: 2 }, { label: 'Wed', day: 3 },
  { label: 'Thu', day: 4 }, { label: 'Fri', day: 5 }, { label: 'Sat', day: 6 }, { label: 'Sun', day: 0 },
];
const MAX = 200;

export function GenerateSheet({ course, currency }: { course: Course; currency: string }) {
  const ui = useUi();
  const [days, setDays] = useState<number[]>([]);
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState(isoFwd(56)); // ~8 weeks
  const [amount, setAmount] = useState(course.fee ? String(course.fee) : '');
  const [paid, setPaid] = useState(false);

  const dates = genDates(start, end, days);
  const count = dates.length;

  const gen = useAction(() =>
    api.addSessions(course.id, dates.map((date) => ({ date, amount: parseFloat(amount) || 0, paid, note: '' }))));

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  async function save() {
    if (count === 0) { alert('Pick at least one weekday and a valid date range.'); return; }
    if (count > MAX) { alert(`That would create ${count} sessions. Please narrow the range (max ${MAX}).`); return; }
    try { await gen.mutateAsync(); ui.closeSheet(); } catch (e) { alert((e as Error).message); }
  }

  return (
    <>
      <h2>Generate sessions</h2>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '-4px 0 6px' }}>
        Create recurring sessions for {course.name} on the days it runs.
      </p>
      <div className="field"><label>Repeats on</label>
        <div className="wddays">
          {WEEKDAYS.map((w) => (
            <div key={w.day} className={'wd' + (days.includes(w.day) ? ' on' : '')}
              onClick={() => toggleDay(w.day)}>{w.label}</div>
          ))}
        </div>
      </div>
      <div className="row2">
        <div className="field"><label>From</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="field"><label>Until</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
      </div>
      <div className="field"><label>Amount per session ({currency})</label>
        <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25" /></div>
      <div className="field">
        <div className={'toggle' + (paid ? ' on' : '')} onClick={() => setPaid(!paid)}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Mark as paid</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Usually off for future sessions.</div>
          </div>
          <div className="sw" />
        </div>
      </div>
      <div className="actions">
        <button className="btn primary" disabled={gen.isPending || count === 0} onClick={save}>
          {count > 0 ? `Generate ${count} session${count === 1 ? '' : 's'}` : 'Generate sessions'}
        </button>
      </div>
    </>
  );
}
