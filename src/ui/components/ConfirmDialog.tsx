/** Confirmation dialog for destructive/session-ending actions. See 02 §15. */
import { useEffect, useRef } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel, onConfirm])

  return (
    // Backdrop click cancels (pointer enhancement); Escape and the Cancel button are the
    // keyboard-accessible paths, with focus defaulting to Cancel.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(6,7,8,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="glass modal-in" role="alertdialog" aria-modal="true" aria-label={message} style={{ width: 'min(400px, 92vw)', padding: '26px 28px', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ margin: '0 0 22px', color: 'var(--sand-100)', fontSize: 15, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} style={{ flex: 1 }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
