import type { Attendance, FamilyState } from '../types';
import { useUi } from '../ui';
import { useTogglePaid, useSetAttendance, useDeleteCourse } from '../hooks';
import { ICONS, ICON_TINT, FEELABEL } from '../lib/constants';
import { fmtDate, latestSession, money, todayISO, findCourse } from '../lib/format';
import { SessionSheet } from '../sheets/SessionSheet';
import { GenerateSheet } from '../sheets/GenerateSheet';

// Tapping the attendance pill cycles through the states.
const ATT_NEXT: Record<Attendance, Attendance> = {
  unknown: 'present', present: 'absent', absent: 'cancelled', cancelled: 'unknown',
};
const ATT_VIEW: Record<Attendance, { label: string; cls: string }> = {
  unknown: { label: 'Attendance', cls: 'none' },
  present: { label: '✓ Present', cls: 'paid' },
  absent: { label: '✗ Absent', cls: 'over' },
  cancelled: { label: '⊘ Cancelled', cls: 'none' },
};

export function CourseDetail({ state, courseId }: { state: FamilyState; courseId: string }) {
  const ui = useUi();
  const found = findCourse(state, courseId);
  const toggle = useTogglePaid();       // optimistic: flips instantly, reconciles in the background
  const att = useSetAttendance();       // optimistic attendance setter
  const del = useDeleteCourse();

  if (!found) { ui.back(); return null; }
  const co = found.course;
  const ls = latestSession(co);
  const tint = ICON_TINT[co.icon] || ICON_TINT.other;
  const sessions = [...co.sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="detail">
      <div className="ch-head">
        <div className="thumb" style={{ background: tint }}>{ICONS[co.icon] || ICONS.other}</div>
        <div><div className="nm">{co.name}</div><div className="ft">{FEELABEL[co.feeType]} · {money(state.currency, co.fee)}</div></div>
      </div>

      <div className="detail-info">
        <div className="hero">
          <div className="lbl">Last attended session</div>
          <div className="row">
            <span className="d">{ls ? fmtDate(ls.date) : '—'}</span>
            <span className="a">{money(state.currency, ls ? ls.amount : 0)}</span>
          </div>
        </div>

        <div className="meta">
          <div className="r"><span className="i">👤</span><span className="k">Instructor</span><span className="v">{co.instructor || '—'}</span></div>
          <div className="r"><span className="i">📍</span><span className="k">Location</span><span className="v">{co.location || '—'}</span></div>
          <div className="r"><span className="i">🔁</span><span className="k">Schedule</span><span className="v">{co.schedule || '—'}</span></div>
          <div className="r"><span className="i">💶</span><span className="k">Fee</span><span className="v">{money(state.currency, co.fee)} / {co.feeType}</span></div>
        </div>
      </div>

      <div className="detail-sessions">
        <div className="sechead">
          <h2>Recent sessions</h2>
          <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
            <button className="link" onClick={() => ui.openSheet(<GenerateSheet course={co} currency={state.currency} />)}>🔁 Generate</button>
            <button className="link" onClick={() => ui.openSheet(<SessionSheet course={co} currency={state.currency} />)}>＋ Log session</button>
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="empty" style={{ padding: 24 }}><p>No sessions logged yet.</p></div>
        ) : (
          sessions.map((s) => {
            const over = !s.paid && s.date < todayISO();
            const cls = s.paid ? 'paid' : over ? 'over' : 'due';
            const label = s.paid ? 'Paid' : over ? 'Overdue' : 'Unpaid';
            const av = ATT_VIEW[s.attendance];
            return (
              <div className="ses" key={s.id}>
                <div className="dt">
                  {fmtDate(s.date)}{s.note && <small>{s.note}</small>}
                  <button className="togp att-pill" onClick={() => att.mutate({ id: s.id, attendance: ATT_NEXT[s.attendance] })}>
                    <span className={'pill ' + av.cls}>{av.label}</span>
                  </button>
                </div>
                <div className="rt">
                  <span className="amt">{money(state.currency, s.amount)}</span>
                  <button className="togp" onClick={() => toggle.mutate({ id: s.id, paid: !s.paid })}>
                    <span className={'pill ' + cls}>{label}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}

        <button className="btn danger detail-delete" style={{ marginTop: 22 }}
          onClick={() => {
            if (!confirm('Delete this course?')) return;
            del.mutate(co.id, { onError: (e) => alert(e.message) });
            ui.back();
          }}>Delete this course</button>
      </div>
    </div>
  );
}
