import { useMemo, useState } from 'react';
import type { Course, FamilyState } from '../types';
import { useUi } from '../ui';
import { useAddSession } from '../hooks';
import { todayISO } from '../lib/format';

interface PickCourse { id: string; childName: string; name: string; fee: number; }

// Two modes:
//  - course-scoped (opened from a course's detail): pass `course`.
//  - calendar (opened from a day): pass `state` + `initialDate`; the sheet then
//    shows a course picker so the session has something to attach to.
export function SessionSheet({
  course, state, currency, initialDate,
}: {
  course?: Course;
  state?: FamilyState;
  currency: string;
  initialDate?: string;
}) {
  const ui = useUi();

  const pickable = useMemo<PickCourse[]>(() => {
    if (course || !state) return [];
    const list: PickCourse[] = [];
    state.children.forEach((ch) =>
      ch.courses.forEach((co) =>
        list.push({ id: co.id, childName: ch.name, name: co.name, fee: co.fee })));
    return list;
  }, [course, state]);

  const [courseId, setCourseId] = useState(course?.id ?? pickable[0]?.id ?? '');
  const startFee = course?.fee ?? pickable[0]?.fee;

  const [date, setDate] = useState(initialDate ?? todayISO());
  const [amount, setAmount] = useState(startFee ? String(startFee) : '');
  const [note, setNote] = useState('');
  const [paid, setPaid] = useState(false);

  // Picking a different course refills the amount with that course's fee.
  function pickCourse(id: string) {
    setCourseId(id);
    const fee = pickable.find((c) => c.id === id)?.fee;
    setAmount(fee ? String(fee) : '');
  }

  const add = useAddSession();

  function save() {
    if (!courseId) return;
    // Optimistic: the session shows up instantly and the sheet closes; if the
    // server rejects it, the cache rolls back and we surface the error.
    add.mutate(
      { courseId, data: { date, amount: parseFloat(amount) || 0, paid, note: note.trim() } },
      { onError: (e) => alert(e.message) },
    );
    ui.closeSheet();
  }

  // Calendar mode but nothing to attach a session to yet.
  if (!course && state && pickable.length === 0) {
    return (
      <>
        <h2>Log a session</h2>
        <div className="empty" style={{ padding: 20 }}>
          <p>Add a child and a course first — then you can log sessions straight from the calendar.</p>
        </div>
        <div className="actions"><button className="btn" onClick={() => ui.closeSheet()}>Close</button></div>
      </>
    );
  }

  return (
    <>
      <h2>Log a session</h2>

      {!course && pickable.length > 0 && (
        <div className="field"><label>Course</label>
          <select value={courseId} onChange={(e) => pickCourse(e.target.value)}>
            {pickable.map((c) => (
              <option key={c.id} value={c.id}>{c.childName} · {c.name}</option>
            ))}
          </select>
        </div>
      )}

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
      <div className="actions">
        <button className="btn" onClick={() => ui.closeSheet()}>Cancel</button>
        <button className="btn primary" disabled={!courseId} onClick={save}>Add session</button>
      </div>
    </>
  );
}
