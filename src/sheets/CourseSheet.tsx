import { useState, type CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Course, CourseInput, FeeType } from '../types';
import { useUi } from '../ui';
import { useAction, useFamilyState } from '../hooks';
import { api } from '../lib/api';
import { ICONS } from '../lib/constants';
import { todayISO } from '../lib/format';

const FEE_TYPES: FeeType[] = ['session', 'month', 'term'];

// Monday-first labels mapped to JS getDay() values (0 = Sun … 6 = Sat).
const WEEKDAYS: { label: string; dow: number }[] = [
  { label: 'Mon', dow: 1 }, { label: 'Tue', dow: 2 }, { label: 'Wed', dow: 3 },
  { label: 'Thu', dow: 4 }, { label: 'Fri', dow: 5 }, { label: 'Sat', dow: 6 }, { label: 'Sun', dow: 0 },
];

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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

  // recurring builder
  const [showRecur, setShowRecur] = useState(false);
  const [recurDays, setRecurDays] = useState<number[]>([]);
  const [recurFrom, setRecurFrom] = useState(todayISO());
  const [recurTo, setRecurTo] = useState('');

  const courseInput = (): CourseInput => ({
    name: name.trim(), instructor: instructor.trim(), location: location.trim(),
    schedule: schedule.trim(), fee: parseFloat(fee) || 0, feeType, icon,
  });

  const upd = useAction((id: string) => api.updateCourse(id, courseInput()));

  // --- draft session helpers (add mode only)
  const addSessionRow = () =>
    setSessions((s) => [...s, { date: todayISO(), amount: fee || '', paid: false }]);
  const setSession = (i: number, patch: Partial<DraftSession>) =>
    setSessions((s) => s.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const removeSession = (i: number) =>
    setSessions((s) => s.filter((_, j) => j !== i));
  const toggleDay = (dow: number) =>
    setRecurDays((d) => (d.includes(dow) ? d.filter((x) => x !== dow) : [...d, dow]));

  function generateRecurring() {
    if (recurDays.length === 0) { alert('Pick at least one weekday.'); return; }
    if (!recurFrom || !recurTo) { alert('Pick a start and end date.'); return; }
    const start = new Date(recurFrom + 'T00:00:00');
    const end = new Date(recurTo + 'T00:00:00');
    if (end < start) { alert('The end date is before the start date.'); return; }
    const out: DraftSession[] = [];
    const d = new Date(start);
    let guard = 0;
    while (d <= end && guard < 400) {
      if (recurDays.includes(d.getDay())) out.push({ date: isoOf(d), amount: fee || '', paid: false });
      d.setDate(d.getDate() + 1);
      guard++;
    }
    if (out.length === 0) { alert('No matching days in that range.'); return; }
    setSessions((s) => [...s, ...out]);
    setShowRecur(false);
    setRecurDays([]);
    setRecurTo('');
  }

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

  const linkBtn: CSSProperties = {
    background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '4px 0',
  };

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
          {sessions.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 8px' }}>
              Add sessions now — one at a time or a recurring run — or skip and add them later.
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--muted)', fontWeight: 600, margin: '2px 0 8px' }}>
              <span>{sessions.length} session{sessions.length === 1 ? '' : 's'} ready</span>
              <button type="button" style={{ ...linkBtn, padding: 0 }} onClick={() => setSessions([])}>Clear all</button>
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

          <div style={{ display: 'flex', gap: 16 }}>
            <button type="button" onClick={addSessionRow} style={linkBtn}>＋ Add one</button>
            <button type="button" onClick={() => setShowRecur((v) => !v)} style={linkBtn}>
              {showRecur ? 'Hide recurring' : '🔁 Add recurring'}
            </button>
          </div>

          {showRecur && (
            <div style={{ marginTop: 10, padding: 12, border: '1px solid var(--line-2)', borderRadius: 11, background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Repeat weekly on</div>
              <div className="seg" style={{ flexWrap: 'wrap', gap: 6 }}>
                {WEEKDAYS.map((w) => (
                  <div key={w.dow} className={'o' + (recurDays.includes(w.dow) ? ' on' : '')}
                    style={{ flex: '0 0 auto', padding: '8px 11px' }} onClick={() => toggleDay(w.dow)}>{w.label}</div>
                ))}
              </div>
              <div className="row2" style={{ marginTop: 10 }}>
                <div className="field" style={{ margin: 0 }}><label>From</label>
                  <input type="date" value={recurFrom} onChange={(e) => setRecurFrom(e.target.value)} /></div>
                <div className="field" style={{ margin: 0 }}><label>To</label>
                  <input type="date" value={recurTo} onChange={(e) => setRecurTo(e.target.value)} /></div>
              </div>
              <button type="button" className="btn primary sm" style={{ marginTop: 10 }} onClick={generateRecurring}>Generate sessions</button>
            </div>
          )}
        </div>
      )}

      <div className="actions">
        <button className="btn" onClick={() => ui.closeSheet()}>Cancel</button>
        <button className="btn primary" disabled={busy} onClick={save}>Save course</button>
      </div>
    </>
  );
}
