import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useFamilyState } from './hooks';
import { UiProvider, useUi, type Tab } from './ui';
import { findCourse } from './lib/format';
import { Home } from './screens/Home';
import { Calendar } from './screens/Calendar';
import { Payments } from './screens/Payments';
import { Family } from './screens/Family';
import { CourseDetail } from './screens/CourseDetail';
import { CourseSheet } from './sheets/CourseSheet';

export function Shell() {
  return (
    <UiProvider>
      <ShellInner />
    </UiProvider>
  );
}

function ShellInner() {
  const ui = useUi();
  const { data: state, isLoading } = useFamilyState();
  const busy = useIsFetching() + useIsMutating() > 0;

  return (
    <div className="app">
      <div className={'syncbar' + (busy ? ' on' : '')} />
      <Header />
      <main>
        {isLoading || !state ? (
          <div className="center"><div className="spinner" /></div>
        ) : ui.courseId ? (
          <CourseDetail state={state} courseId={ui.courseId} />
        ) : ui.tab === 'home' ? (
          <Home state={state} />
        ) : ui.tab === 'calendar' ? (
          <Calendar state={state} />
        ) : ui.tab === 'payments' ? (
          <Payments state={state} />
        ) : (
          <Family state={state} />
        )}
      </main>
      <Tabs />
      {ui.sheet && (
        <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) ui.closeSheet(); }}>
          <div className="sheet"><div className="grab" />{ui.sheet}</div>
        </div>
      )}
    </div>
  );
}

function Header() {
  const ui = useUi();
  const { data: state } = useFamilyState();
  if (ui.courseId) {
    const found = state ? findCourse(state, ui.courseId) : null;
    return (
      <header className="bar">
        <button className="iconbtn ghost" onClick={ui.back} aria-label="Back">‹</button>
        <div style={{ flex: 1, textAlign: 'center' }}><div className="kicker">{found?.child.name ?? ''}</div></div>
        <button
          className="iconbtn"
          aria-label="Edit course"
          onClick={() => found && ui.openSheet(<CourseSheet childId={found.child.id} existing={found.course} />)}
        >✎</button>
      </header>
    );
  }
  const titles: Record<Tab, [string, string]> = {
    home: ['Hello', state?.family || 'Family'],
    calendar: ['Your', 'Calendar'],
    payments: ['Track', 'Payments'],
    family: ['Manage', 'Family'],
  };
  const [k, t] = titles[ui.tab];
  const activeChild = state?.children.find((c) => c.id === ui.activeChild) || state?.children[0];
  return (
    <header className="bar">
      <div><div className="kicker">{k}</div><h1>{t}</h1></div>
      {ui.tab === 'home' && activeChild && (
        <button className="iconbtn" aria-label="Add course"
          onClick={() => ui.openSheet(<CourseSheet childId={activeChild.id} />)}>＋</button>
      )}
    </header>
  );
}

function Tabs() {
  const ui = useUi();
  const items: [Tab, string, string][] = [
    ['home', '⌂', 'Home'], ['calendar', '📅', 'Calendar'], ['payments', '💳', 'Payments'], ['family', '👪', 'Family'],
  ];
  return (
    <nav className="tabs">
      <div className="brand">Coursebook</div>
      {items.map(([id, icon, label]) => (
        <button key={id} className={ui.tab === id && !ui.courseId ? 'on' : ''} onClick={() => ui.setTab(id)}>
          <span className="i">{icon}</span><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
