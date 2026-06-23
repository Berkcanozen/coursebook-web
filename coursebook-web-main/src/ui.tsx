import { createContext, useContext, useState, type ReactNode } from 'react';

export type Tab = 'home' | 'calendar' | 'payments' | 'family';
export type PayFilter = 'all' | 'unpaid' | 'paid';

interface UiCtx {
  tab: Tab;
  courseId: string | null;
  activeChild: string | null;
  payFilter: PayFilter;
  sheet: ReactNode | null;
  setTab: (t: Tab) => void;
  openCourse: (id: string) => void;
  back: () => void;
  setActiveChild: (id: string) => void;
  setPayFilter: (f: PayFilter) => void;
  openSheet: (node: ReactNode) => void;
  closeSheet: () => void;
}
const Ctx = createContext<UiCtx | null>(null);
export const useUi = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUi must be used inside UiProvider');
  return v;
};

export function UiProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('home');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [activeChild, setActiveChild] = useState<string | null>(null);
  const [payFilter, setPayFilter] = useState<PayFilter>('all');
  const [sheet, setSheet] = useState<ReactNode | null>(null);

  const value: UiCtx = {
    tab, courseId, activeChild, payFilter, sheet,
    setTab: (t) => { setCourseId(null); setTab(t); },
    openCourse: (id) => setCourseId(id),
    back: () => setCourseId(null),
    setActiveChild,
    setPayFilter,
    openSheet: (node) => setSheet(node),
    closeSheet: () => setSheet(null),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
