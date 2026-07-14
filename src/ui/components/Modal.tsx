/** Focus-trapped modal — esc/backdrop close, returns focus to trigger. See 03 §13. */
import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: number
  /** Footer actions row (optional). */
  footer?: ReactNode
}

export function Modal({ title, onClose, children, maxWidth = 560, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    headingRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prevFocus?.focus?.()
    }
  }, [onClose])

  return (
    // Backdrop click-to-dismiss is a pointer enhancement; Escape and the ✕ button are
    // the keyboard-accessible close paths (dialog traps focus below).
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      style={overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="glass modal-in scroll-thin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ ...panel, maxWidth }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <h2 id="modal-title" ref={headingRef} tabIndex={-1} style={heading}>
            {title}
          </h2>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn-ghost" aria-label="Close" onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>
        <div>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>{footer}</div>}
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 40,
  background: 'rgba(6, 7, 8, 0.55)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
}

const panel: React.CSSProperties = {
  width: '100%',
  maxHeight: '88vh',
  overflowY: 'auto',
  borderRadius: 'var(--radius-lg)',
  padding: '28px 32px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
}

const heading: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--sand-50)',
  letterSpacing: '-0.01em',
  outline: 'none',
}

const closeBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  padding: 0,
  borderRadius: 'var(--radius-sm)',
  fontSize: 15,
  lineHeight: 1,
}
