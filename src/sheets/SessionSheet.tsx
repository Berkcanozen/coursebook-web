import { useState } from 'react';
import type { Course } from '../types';
import { useUi } from '../ui';
import { useAction } from '../hooks';
import { api } from '../lib/api';
import { todayISO } from '../lib/format';

export function SessionSheet({ course, currency }: { course: Course; currency: string }) {
  const ui = useUi();
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState(course.fee ? String(course.fee) : '');
  const [note, setNote] = useState('');
  const [paid, setPaid] = useState(true);

  const add = useAction(() => api.addSession(course.id, { date, amount: parseFloat(amount) || 0, paid, note: note.trim() }));

  async function save() {
    try { await add.mutateAsync(); ui.closeSheet(); } catch (e) { alert((e as Error).message); }
  }

  return (
    <>
      <h2>Log a session</h2>
      <div className="row2">
        <div className="field"><label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field"><label>Amount ({currency})</label>
          <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25" /></div>
      </div>
      <div className="field"><label>Note (optional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. extra-long lesson" /></div>
      <div className="field">
        <div className={'toggle' + (paid ? ' on' : '')} onClick={() => setPaid(!paid)}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Paid</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Has this session been paid for?</div>
          </div>
          <div className="sw" />
        </div>
      </div>
      <div className="actions"><button className="btn primary" disabled={add.isPending} onClick={save}>Add session</button></div>
    </>
  );
}
