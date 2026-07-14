/** App-level error boundary — dignified fallback, never a white screen. See 07 §7. */
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Dev-only surfacing; a production logger would go here (Blueprint §18.7 — no console.log in prod).
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('COTE crashed:', error, info)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div role="alert" style={wrap}>
        <div className="glass" style={card}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--sand-50)' }}>Something went wrong.</h1>
          <p style={{ margin: '10px 0 22px', color: 'var(--stone-400)', fontSize: 14, lineHeight: 1.6 }}>
            COTE hit an unexpected error. Reloading usually fixes it — your local stats are safe.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()} style={{ padding: '11px 24px' }}>
            Reload
          </button>
        </div>
      </div>
    )
  }
}

const wrap: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: 'var(--canvas)',
}
const card: React.CSSProperties = {
  maxWidth: 420,
  textAlign: 'center',
  padding: '36px 40px',
  borderRadius: 'var(--radius-lg)',
}
