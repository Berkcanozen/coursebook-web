import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Course, CourseInput, FeeType } from '../types';
import { useUi } from '../ui';
import { useAction, useFamilyState } from '../hooks';
import { api } from '../lib/api';
import { ICONS } from '../lib/constants';
import { todayISO } from '../lib/format';

const FEE_TYPES: FeeType[] = ['session', 'month', 'term'];

// A session being drafted alongside a brand-new course (amount kept as a string
// while editing, parsed on save).
interface DraftSession { date: string; amount: string; paid: boolean; }

export function CourseSheet({ childId, existing }: { childId: string; existing?: Course }) {
  const ui = useUi();
  const qc = useQueryClient();
  const { data: state } = useFamilyState();
  const cur = state?.currency ?? '€';

  const [name, setName] = useState(existing?.name ?? '');
  const [instructor, setInstructor] = useState(existing?.instructor ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [schedule, setSchedule] = useState(existing?.schedule ?? '');
  const [fee, setFee] = useState(existing ? String(existing.fee) : '');
  const [feeType, setFeeType] = useState<FeeType>(existing?.feeType ?? 'session');
  const [icon, setIcon] = useState(existing?.icon ?? 'music');
  const [sessions, setSessions] = useState<DraftSession[]>([]);
  const [busy, setBusy] = useState(false);

  const courseInput = (): CourseInput => ({
    name: name.trim(), instructor: instructor.trim(), location: location.trim(),
    schedule: schedule.trim(), fee: parseFloat(fee) || 0, feeType, icon,
  });

  const upd = useAction((id: string) => api.updateCourse(id, courseInput()));

  // --- draft session helpers (add mode only)
  const addSessionRow = () =>
    setSessions((s) => [...s, { date: todayISO(), amount: fee || '', paid: true }]);
  const setSession = (i: number, patch: Partial<DraftSession>) =>
    setSessions((s) => s.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const removeSession = (i: number) =>
    setSessions((s) => s.filter((_, j) => j !== i));

  async function save() {
    if (!name.trim()) { alert('Please enter a course name.'); return; }
    setBusy(true);
    try {
      if (existing) {
        await upd.mutateAsync(existing.id);
        ui.closeSheet();
        return;
      }
      // Create the course, then any sessions drafted alongside it, then refresh once.
      const course = await api.addCourse(childId, courseInput());
      for (const s of sessions.filter((d) => d.date)) {
        await api.addSession(course.id, { date: s.date, amount: parseFloat(s.amount) || 0, paid: s.paid, note: '' });
      }
      qc.invalidateQueries({ queryKey: ['state'] });
      ui.openCourse(course.id);
      ui.closeSheet();
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <h2>{existing ? 'Edit course' : 'Add a course'}</h2>
      <div className="field"><label>Course name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Piano lessons" autoFocus /></div>
      <div className="field"><label>Type</label>
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {Object.keys(ICONS).map((k) => (
            <div key={k} className={'o' + (k === icon ? ' on' : '')} style={{ fontSize: 18, padding: '8px 4px' }} onClick={() => setIcon(k)}>{ICONS[k]}</div>
          ))}
        </div>
      </div>
      <div className="field"><label>Instructor / provider</label>
        <input value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="e.g. Ms. Petrova" /></div>
      <div className="field"><label>Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Harmony Music School" /></div>
      <div className="field"><label>Schedule</label>
        <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. Mon & Wed · 16:00" /></div>
      <div className="row2">
        <div className="field"><label>Fee amount ({cur})</label>
          <input type="number" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="25" /></div>
        <div className="field"><label>Billed</label>
          <div className="seg" style={{ flexDirection: 'column', gap: 6 }}>
            {FEE_TYPES.map((t) => (
              <div key={t} className={'o' + (t === feeType ? ' on' : '')} onClick={() => setFeeType(t)}>per {t}</div>
            ))}
          </div>
        </div>
      </div>

      {!existing && (
        <div className="field">
          <label>Sessions (optional)</label>
          {sessions.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 10px' }}>
              Log a few sessions now, or skip and add them later.
            </div>
          )}
          {sessions.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input type="date" value={s.date} onChange={(e) => setSession(i, { date: e.target.value })}
                style={{ flex: '1 1 auto', width: 'auto', minWidth: 0 }} />
              <input type="number" inputMode="decimal" value={s.amount} placeholder="0"
                onChange={(e) => setSession(i, { amount: e.target.value })}
                style={{ flex: '0 0 84px', width: 84 }} />
              <button type="button" onClick={() => setSession(i, { paid: !s.paid })}
                className={'pill ' + (s.paid ? 'paid' : 'due')}
                style={{ marginTop: 0, border: 'none', cursor: 'pointer', padding: '7px 11px', flex: '0 0 auto' }}>
                {s.paid ? 'Paid' : 'Unpaid'}
              </button>
              <button type="button" onClick={() => removeSession(i)} className="iconbtn ghost" aria-label="Remove session"
                style={{ width: 32, height: 32, fontSize: 15, flex: '0 0 auto' }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addSessionRow}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>
            ＋ Add session
          </button>
        </div>
      )}

      <div className="actions"><button className="btn primary" disabled={busy} onClick={save}>Save course</button></div>
    </>
  );
}
