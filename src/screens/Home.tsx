import type { FamilyState } from '../types';
import { useUi } from '../ui';
import { ICONS, ICON_TINT, FEELABEL } from '../lib/constants';
import { courseStatus, latestSession, money, outstanding, paidThisYear, PILL } from '../lib/format';
import { ChildSheet } from '../sheets/ChildSheet';
import { CourseSheet } from '../sheets/CourseSheet';
import { useAction } from '../hooks';
import { api } from '../lib/api';
import { CHILD_COLORS } from '../lib/constants';
import { isoBack } from '../lib/format';

export function Home({ state }: { state: FamilyState }) {
  const ui = useUi();
  const active = state.children.find((c) => c.id === ui.activeChild) || state.children[0] || null;
  const year = new Date().getFullYear();
  const sample = useAction(loadSample);

  return (
    <>
      <div className="chips">
        {state.children.map((c) => (
          <button key={c.id} className={'chip' + (active && c.id === active.id ? ' on' : '')}
            onClick={() => ui.setActiveChild(c.id)}>
            <span className="dot" style={{ background: c.color }} />{c.name}
          </button>
        ))}
        <button className="chip add" onClick={() => ui.openSheet(<ChildSheet />)}>＋ Child</button>
      </div>

      <div className="summary">
        <div className="stat due"><div className="lbl">Outstanding</div><div className="val">{money(state.currency, outstanding(state))}</div></div>
        <div className="stat paid"><div className="lbl">Paid in {year}</div><div className="val">{money(state.currency, paidThisYear(state))}</div></div>
      </div>

      <div className="sechead">
        <h2>{active ? `${active.name}'s courses` : 'Courses'}</h2>
        {active && active.courses.length > 0 && (
          <button className="link" onClick={() => ui.openSheet(<CourseSheet childId={active.id} />)}>＋ Add</button>
        )}
      </div>

      {!active ? (
        <div className="empty">
          <div className="big">👋</div>
          <h3>Welcome{state.family ? `, ${state.family}` : ''}</h3>
          <p>Add your first child, or load sample data to explore.</p>
          <button className="btn primary sm" onClick={() => ui.openSheet(<ChildSheet />)}>＋ Add child</button>
          <div style={{ height: 8 }} />
          <button className="btn soft sm" disabled={sample.isPending}
            onClick={() => sample.mutate()}>Load sample data</button>
        </div>
      ) : active.courses.length === 0 ? (
        <div className="empty">
          <div className="big">🎒</div><h3>No courses yet</h3><p>Add {active.name}'s first class.</p>
          <button className="btn primary sm" onClick={() => ui.openSheet(<CourseSheet childId={active.id} />)}>＋ Add course</button>
        </div>
      ) : (
        <div className="course-grid">{active.courses.map((co) => {
          const st = courseStatus(co); const ls = latestSession(co);
          const tint = ICON_TINT[co.icon] || ICON_TINT.other;
          return (
            <button key={co.id} className="card" onClick={() => ui.openCourse(co.id)}>
              <div className="thumb" style={{ background: tint }}>{ICONS[co.icon] || ICONS.other}</div>
              <div className="body">
                <div className="nm">{co.name}</div>
                <div className="sub">🕑 {co.schedule || FEELABEL[co.feeType]}</div>
              </div>
              <div className="right">
                <div className="amt">{money(state.currency, ls ? ls.amount : co.fee)}</div>
                <span className={'pill ' + PILL[st][0]}>{PILL[st][1]}</span>
              </div>
            </button>
          );
        })}</div>
      )}
    </>
  );
}

async function loadSample() {
  const e = await api.addChild('Emma', CHILD_COLORS[0]);
  const l = await api.addChild('Liam', CHILD_COLORS[1]);
  const piano = await api.addCourse(e.id, { name: 'Piano lessons', instructor: 'Ms. Petrova', location: 'Harmony Music School', schedule: 'Mon & Wed · 16:00', fee: 25, feeType: 'session', icon: 'music' });
  await api.addSession(piano.id, { date: isoBack(4), amount: 25, paid: true, note: '' });
  await api.addSession(piano.id, { date: isoBack(6), amount: 25, paid: true, note: '' });
  await api.addSession(piano.id, { date: isoBack(11), amount: 25, paid: false, note: '' });
  const swim = await api.addCourse(e.id, { name: 'Swimming club', instructor: 'Coach Daniel', location: 'Aqua Centre', schedule: 'Sat · 10:30', fee: 60, feeType: 'month', icon: 'sport' });
  await api.addSession(swim.id, { date: isoBack(2), amount: 60, paid: false, note: 'June' });
  const fr = await api.addCourse(e.id, { name: 'French tutoring', instructor: 'Mme Laurent', location: 'Online', schedule: 'Thu · 17:30', fee: 30, feeType: 'session', icon: 'language' });
  await api.addSession(fr.id, { date: isoBack(3), amount: 30, paid: true, note: '' });
  const foot = await api.addCourse(l.id, { name: 'Football academy', instructor: 'Coach Rui', location: 'Greenfield Pitch', schedule: 'Tue & Fri · 18:00', fee: 45, feeType: 'month', icon: 'sport' });
  await api.addSession(foot.id, { date: isoBack(5), amount: 45, paid: true, note: 'June' });
  const code = await api.addCourse(l.id, { name: 'Coding club', instructor: 'Mr. Tan', location: 'STEM Lab', schedule: 'Wed · 15:00', fee: 20, feeType: 'session', icon: 'code' });
  await api.addSession(code.id, { date: isoBack(1), amount: 20, paid: false, note: '' });
  await api.addSession(code.id, { date: isoBack(8), amount: 20, paid: true, note: '' });
}
