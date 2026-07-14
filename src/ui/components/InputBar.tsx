/** Always-focused guess input with inline suggestion + feedback. See 02 §8, 03 §11. */
import { forwardRef } from 'react'
import type { Country } from '../../game/countries'
import type { Feedback } from '../../game/useGameState'

interface InputBarProps {
  value: string
  onChange: (v: string) => void
  onEnter: () => void
  suggestion: Country | null
  onAcceptSuggestion: (c: Country) => void
  feedback: Feedback | null
  disabled: boolean
  finished: boolean
}

export const InputBar = forwardRef<HTMLInputElement, InputBarProps>(function InputBar(
  { value, onChange, onEnter, suggestion, onAcceptSuggestion, feedback, disabled, finished },
  ref,
) {
  const feedbackColor =
    feedback?.kind === 'good'
      ? 'var(--success)'
      : feedback?.kind === 'bad'
        ? 'var(--danger)'
        : 'var(--stone-400)'

  return (
    <div
      className="glass"
      style={{
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 'min(560px, 90vw)',
      }}
    >
      <label htmlFor="guess-input" style={srOnly}>
        Type a country name
      </label>
      <input
        id="guess-input"
        ref={ref}
        className={`input ${feedback?.kind === 'bad' ? 'input-shake' : ''}`}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        placeholder={finished ? 'Game over — start a new game' : 'Type a country name…'}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter()
        }}
        style={{ padding: '11px 14px', fontSize: 16 }}
      />
      <div
        aria-live="polite"
        style={{ minHeight: 20, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}
      >
        {feedback && (
          <span style={{ fontSize: 12, fontWeight: 600, color: feedbackColor }}>{feedback.msg}</span>
        )}
        {!feedback && suggestion && (
          <>
            <span style={{ color: 'var(--stone-400)', fontSize: 12 }}>Did you mean</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onAcceptSuggestion(suggestion)}
              style={{ padding: '2px 10px', fontSize: 12, fontWeight: 600, color: 'var(--brass-300)' }}
            >
              {suggestion.name}
            </button>
            <span style={{ color: 'var(--stone-400)', fontSize: 12 }}>?</span>
          </>
        )}
      </div>
    </div>
  )
})

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
}
