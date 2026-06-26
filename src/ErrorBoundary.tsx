import { Component, type ReactNode } from 'react';

// Catches render-time errors anywhere below it so a single thrown error shows a
// recoverable fallback instead of white-screening the installed PWA.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: unknown) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app">
          <div className="center" style={{ flexDirection: 'column', gap: 14, textAlign: 'center', padding: '0 30px' }}>
            <div>
              Something went wrong.
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{this.state.error.message}</div>
            </div>
            <button className="btn primary sm" onClick={() => location.reload()}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
