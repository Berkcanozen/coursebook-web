import { useState } from 'react';
import type { Course, FeeType } from '../types';
import { useUi } from '../ui';
import { useAction } from '../hooks';
import { api } from '../lib/api';
import { ICONS } from '../lib/constants';
import { useFamilyState } from '../hooks';

const FEE_TYPES: FeeType[] = ['session', 'month', 'term'];

export function CourseSheet({ childId, existing }: { childId: string; existing?: Course }) {
  const ui = useUi();
  const { data: state } = useFamilyState();
  const cur = state?.currency ?? '€';

  const [name, setName] = useState(existing?.name ?? '');
  const [instructor, setInstructor] = useState(existing?.instructor ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [schedule, setSchedule] = useState(existing?.schedule ?? '');
  const [fee, setFee] = useState(existing ? String(existing.fee) : '');
  const [feeType, setFeeType] = useState<FeeType>(existing?.feeType ?? 'session');
  const [icon, setIcon] = useState(existing?.icon ?? 'music');

  const add = useAction((p: { childId: string }) =>
    api.addCourse(p.childId, { name: name.trim(), instructor: instructor.trim(), location: location.trim(), schedule: schedule.trim(), fee: parseFloat(fee) || 0, feeType, icon }));
  const upd = useAction((id: string) =>
    api.updateCourse(id, { name: name.trim(), instructor: instructor.trim(), location: location.trim(), schedule: schedule.trim(), fee: parseFloat(fee) || 0, feeType, icon }));
  const busy = add.isPending || upd.isPending;

  async function save() {
    if (!name.trim()) { alert('Please enter a course name.'); return; }
    try {
      if (existing) await upd.mutateAsync(existing.id);
      else { const c = await add.mutateAsync({ childId }); ui.openCourse(c.id); }
      ui.closeSheet();
    } catch (e) { alert((e as Error).message); }
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
      <div className="actions"><button className="btn primary" disabled={busy} onClick={save}>Save course</button></div>
    </>
  );
}
