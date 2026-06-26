import type { FamilyState } from '../types';
import { useUi } from '../ui';
import { useAction, useToggleSessionPaid } from '../hooks';
import { api } from '../lib/api';
import { ICONS, ICON_TINT, FEELABEL } from '../lib/constants';
import { fmtDate, latestSession, money, todayISO, findCourse } from '../lib/format';
import { SessionSheet } from '../sheets/SessionSheet';
import { GenerateSheet } from '../sheets/GenerateSheet';

export function CourseDetail({ state, courseId }: { state: FamilyState; courseId: string }) {
  const ui = useUi();
  const found = findCourse(state, courseId);
  const toggle = useToggleSessionPaid();
  const del = useAction((id: string) => api.deleteCourse(id));

  if (!found) { ui.back(); return null; }
  const co = found.course;
  const ls = latestSession(co);
  const tint = ICON_TINT[co.icon] || ICON_TINT.other;
  const sessions = [...co.sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="ch-head">
        <div className="thumb" style={{ background: tint }}>{ICONS[co.icon] || ICONS.other}</div>
        <div><div className="nm">{co.name}</div><div className="ft">{FEELABEL[co.feeType]} · {money(state.currency, co.fee)}</div></div>
      </div>

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

      <div className="sechead">
        <h2>Recent sessions</h2>
        <div style={{ display: 'flex', gap: 14 }}>
          <button className="link" onClick={() => ui.openSheet(<GenerateSheet course={co} currency={state.currency} />)}>⟳ Generate</button>
          <button className="link" onClick={() => ui.openSheet(<SessionSheet course={co} currency={state.currency} />)}>＋ Log session</button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="empty" style={{ padding: 24 }}><p>No sessions logged yet.</p></div>
      ) : (
        sessions.map((s) => {
          const over = !s.paid && s.date < todayISO();
          const cls = s.paid ? 'paid' : over ? 'over' : 'due';
          const label = s.paid ? 'Paid' : over ? 'Overdue' : 'Unpaid';
          return (
            <div className="ses" key={s.id}>
              <div className="dt">{fmtDate(s.date)}{s.note && <small>{s.note}</small>}</div>
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

      <button className="btn danger" style={{ marginTop: 22 }}
        onClick={async () => {
          if (!confirm('Delete this course?')) return;
          await del.mutateAsync(co.id).catch((e) => alert(e.message));
          ui.back();
        }}>Delete this course</button>
    </>
  );
}
