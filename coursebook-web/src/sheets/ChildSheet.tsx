import { useState } from 'react';
import type { Child } from '../types';
import { useUi } from '../ui';
import { useAction } from '../hooks';
import { api } from '../lib/api';
import { CHILD_COLORS } from '../lib/constants';

export function ChildSheet({ existing }: { existing?: Child }) {
  const ui = useUi();
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.color ?? CHILD_COLORS[0]);

  const add = useAction((p: { name: string; color: string }) => api.addChild(p.name, p.color));
  const upd = useAction((p: { id: string; name: string; color: string }) => api.updateChild(p.id, { name: p.name, color: p.color }));
  const del = useAction((id: string) => api.deleteChild(id));
  const busy = add.isPending || upd.isPending || del.isPending;

  async function save() {
    if (!name.trim()) { alert('Please enter a name.'); return; }
    try {
      if (existing) await upd.mutateAsync({ id: existing.id, name: name.trim(), color });
      else { const c = await add.mutateAsync({ name: name.trim(), color }); ui.setActiveChild(c.id); }
      ui.closeSheet();
    } catch (e) { alert((e as Error).message); }
  }

  async function remove() {
    if (!existing || !confirm('Delete this child and all their courses?')) return;
    try { await del.mutateAsync(existing.id); ui.closeSheet(); } catch (e) { alert((e as Error).message); }
  }

  return (
    <>
      <h2>{existing ? 'Edit child' : 'Add a child'}</h2>
      <div className="field"><label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emma" autoFocus /></div>
      <div className="field"><label>Colour</label>
        <div className="colorpick">
          {CHILD_COLORS.map((c) => (
            <div key={c} className={'c' + (c === color ? ' on' : '')} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
      </div>
      <div className="actions">
        {existing && <button className="btn danger" disabled={busy} onClick={remove}>Delete</button>}
        <button className="btn primary" disabled={busy} onClick={save}>Save</button>
      </div>
    </>
  );
}
