import { useRegisterSW } from 'virtual:pwa-register/react';

// Shows a small banner when a new deployed version is waiting, instead of
// silently auto-updating (which could serve a stale bundle for one load).
export function PwaPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div role="status" style={{
      position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 1000,
      margin: '0 auto', maxWidth: 420,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 14,
      background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
      font: '500 14px/1.3 system-ui, sans-serif', color: '#2A2622',
    }}>
      <span style={{ flex: 1 }}>A new version is available.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          border: 'none', cursor: 'pointer', borderRadius: 9,
          padding: '7px 14px', fontWeight: 600,
          background: '#C85A38', color: '#fff',
        }}>
        Reload
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{
          border: 'none', cursor: 'pointer', borderRadius: 9,
          padding: '7px 10px', fontWeight: 600,
          background: 'transparent', color: '#8A8178',
        }}>
        Later
      </button>
    </div>
  );
}
