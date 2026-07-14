/** Top HUD: brand, timer mode + clock, found counter, utility cluster. See 02 §4.1. */
import { TIMER_MODES } from '../../game/constants'
import { TOTAL } from '../../game/countries'
import { formatTime } from '../../game/scoring'

export type OverlayName = 'instructions' | 'leaderboard' | 'stats' | 'achievements'

interface TopBarProps {
  timerIdx: number
  onSetTimerIdx: (i: number) => void
  status: 'idle' | 'playing' | 'finished'
  displaySeconds: number
  isCountdown: boolean
  count: number
  onGiveUp: () => void
  onNewGame: () => void
  onOpen: (name: OverlayName) => void
}

export function TopBar({
  timerIdx,
  onSetTimerIdx,
  status,
  displaySeconds,
  isCountdown,
  count,
  onGiveUp,
  onNewGame,
  onOpen,
}: TopBarProps) {
  const warning = isCountdown && displaySeconds <= 60 && status === 'playing'
  const critical = isCountdown && displaySeconds <= 10 && status === 'playing'

  return (
    <header
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 14px',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.14em', color: 'var(--sand-50)' }}>
        COTE
      </span>
      <Divider />

      <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Timer mode">
        {TIMER_MODES.map((mode, i) => {
          const active = timerIdx === i
          const locked = status !== 'idle' && !active
          return (
            <button
              key={mode.label}
              type="button"
              className="btn tab"
              aria-pressed={active}
              onClick={() => status === 'idle' && onSetTimerIdx(i)}
              style={{
                minWidth: 46,
                padding: '3px 6px',
                fontSize: mode.label === '∞' ? 16 : 11,
                fontWeight: active ? 700 : 500,
                background: active ? 'rgba(217,164,65,0.14)' : 'transparent',
                border: `1px solid ${active ? 'var(--brass-400)' : 'var(--glass-border)'}`,
                color: active ? 'var(--brass-300)' : 'var(--stone-400)',
                opacity: locked ? 0.4 : 1,
                cursor: status === 'idle' ? 'pointer' : 'default',
              }}
            >
              {mode.label}
            </button>
          )
        })}
      </div>
      <Divider />

      <Stat label={isCountdown ? 'Left' : 'Time'}>
        <span
          className={critical ? 'timer-critical' : warning ? 'timer-warn' : ''}
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 20,
            fontWeight: 700,
            color: warning ? 'var(--danger)' : 'var(--sand-50)',
          }}
        >
          {formatTime(displaySeconds)}
        </span>
      </Stat>
      <Divider />

      <Stat label="Found">
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--sand-50)' }}>
          {count}
          <span style={{ color: 'var(--stone-400)', fontSize: 13 }}> / {TOTAL}</span>
        </span>
      </Stat>

      <div style={{ flex: 1 }} />

      {status === 'playing' && (
        <button type="button" className="btn btn-danger" onClick={onGiveUp} style={util}>
          Give Up
        </button>
      )}
      <IconBtn label="How to play" onClick={() => onOpen('instructions')}>ⓘ</IconBtn>
      <IconBtn label="Statistics" onClick={() => onOpen('stats')}>▤</IconBtn>
      <IconBtn label="Achievements" onClick={() => onOpen('achievements')}>★</IconBtn>
      <IconBtn label="Leaderboard" onClick={() => onOpen('leaderboard')}>♛</IconBtn>
      <button type="button" className="btn btn-secondary" onClick={onNewGame} style={util}>
        New Game
      </button>
    </header>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 26, background: 'var(--glass-border)' }} />
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--stone-400)',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ lineHeight: 1 }}>{children}</div>
    </div>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="btn btn-ghost"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ width: 34, height: 30, padding: 0, fontSize: 14 }}
    >
      {children}
    </button>
  )
}

const util: React.CSSProperties = { padding: '5px 12px', fontSize: 12 }
