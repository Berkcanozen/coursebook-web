import { useState } from 'react';
import { useUi } from '../ui';
import { useAction } from '../hooks';
import { api } from '../lib/api';

export function SettingsSheet({ family, currency }: { family: string; currency: string }) {
  const ui = useUi();
  const [fam, setFam] = useState(family);
  const [cur, setCur] = useState(currency);
  const upd = useAction(() => api.updateFamily(fam.trim() || family, cur.trim() || '€'));

  async function save() {
    try { await upd.mutateAsync(); ui.closeSheet(); } catch (e) { alert((e as Error).message); }
  }

  return (
    <>
      <h2>Family settings</h2>
      <div className="field"><label>Family name</label>
        <input value={fam} onChange={(e) => setFam(e.target.value)} placeholder="e.g. The Bakers" /></div>
      <div className="field"><label>Currency symbol</label>
        <input value={cur} maxLength={3} style={{ width: 90 }} onChange={(e) => setCur(e.target.value)} /></div>
      <div className="actions"><button className="btn primary" disabled={upd.isPending} onClick={save}>Save</button></div>
    </>
  );
}
