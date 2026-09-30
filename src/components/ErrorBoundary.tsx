import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render/commit errors so the app shows a readable message
 * (and the error in the console) instead of unmounting to a blank window.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[Fralculator] UI crashed:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column', gap: 14,
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: 40, fontFamily: 'system-ui, sans-serif',
          background: '#0f1117', color: '#eef1f8',
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <p style={{ color: '#9aa3b5', maxWidth: 480 }}>
            {this.state.error.message}
            <br />
            Your history and settings are safe. Open the dev console (Ctrl+Shift+I) for details.
          </p>
          <button
            style={{
              padding: '10px 22px', fontSize: 14, borderRadius: 12, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff',
            }}
            onClick={() => this.setState({ error: null })}
          >
            Try to recover
          </button>
          <button
            style={{
              padding: '10px 22px', fontSize: 14, borderRadius: 12, cursor: 'pointer',
              border: 'none', background: '#4f7cff', color: '#fff',
            }}
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
