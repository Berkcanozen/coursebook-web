import { useState } from 'react';
import { useUi } from '../ui';
import { useAction } from '../hooks';
import { api } from '../lib/api';
import { CURRENCIES } from '../lib/constants';

export function SettingsSheet({ family, currency }: { family: string; currency: string }) {
  const ui = useUi();
  const [fam, setFam] = useState(family);
  const [cur, setCur] = useState(currency);
  const upd = useAction(() => api.updateFamily(fam.trim() || family, cur.trim() || '€'));

  // Make sure the currently-stored currency is always selectable, even if it
  // isn't one of the presets (e.g. an older free-text value).
  const options = CURRENCIES.some((c) => c.symbol === currency)
    ? CURRENCIES
    : [{ code: 'CUR', symbol: currency, label: currency }, ...CURRENCIES];

  async function save() {
    try { await upd.mutateAsync(); ui.closeSheet(); } catch (e) { alert((e as Error).message); }
  }

  return (
    <>
      <h2>Family settings</h2>
      <div className="field"><label>Family name</label>
        <input value={fam} onChange={(e) => setFam(e.target.value)} placeholder="e.g. The Bakers" /></div>
      <div className="field"><label>Currency</label>
        <select value={cur} onChange={(e) => setCur(e.target.value)}>
          {options.map((c) => <option key={c.code} value={c.symbol}>{c.label}</option>)}
        </select></div>
      <div className="actions"><button className="btn primary" disabled={upd.isPending} onClick={save}>Save</button></div>
    </>
  );
}
