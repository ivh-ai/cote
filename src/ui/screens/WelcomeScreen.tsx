/** Welcome surface — orient, choose mode, invite play. See 02 §6. */
import { TIMER_MODES } from '../../game/constants'
import { TOTAL } from '../../game/countries'
import { Button } from '../components/Button'

interface WelcomeScreenProps {
  timerIdx: number
  onSetTimerIdx: (i: number) => void
  onStart: () => void
  onOpenInstructions: () => void
  onOpenLeaderboard: () => void
  onOpenAbout: () => void
}

export function WelcomeScreen({
  timerIdx,
  onSetTimerIdx,
  onStart,
  onOpenInstructions,
  onOpenLeaderboard,
  onOpenAbout,
}: WelcomeScreenProps) {
  return (
    <div style={overlay}>
      <div className="glass modal-in" style={card}>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: 44, letterSpacing: '0.12em', color: 'var(--sand-50)' }}>
          COTE
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--stone-400)', fontSize: 13, letterSpacing: '0.04em' }}>
          Countries of the Earth
        </p>
        <div style={{ height: 1, background: 'var(--glass-border)', margin: '22px 0' }} />
        <p style={{ margin: '0 0 6px', color: 'var(--sand-100)', fontSize: 16, fontWeight: 500 }}>
          Name every country on Earth.
        </p>
        <p style={{ margin: '0 0 24px', color: 'var(--stone-400)', fontSize: 13, lineHeight: 1.7 }}>
          {TOTAL} countries. One globe. How many can you remember?
        </p>

        <div style={{ marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--stone-400)' }}>
          Choose your timer
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 26 }} role="group" aria-label="Timer mode">
          {TIMER_MODES.map((mode, i) => {
            const active = timerIdx === i
            return (
              <button
                key={mode.label}
                type="button"
                className="btn"
                aria-pressed={active}
                onClick={() => onSetTimerIdx(i)}
                style={{
                  minWidth: 58,
                  padding: '8px 6px',
                  fontSize: mode.label === '∞' ? 18 : 13,
                  fontWeight: active ? 700 : 500,
                  background: active ? 'rgba(217,164,65,0.16)' : 'transparent',
                  border: `1px solid ${active ? 'var(--brass-400)' : 'var(--glass-border)'}`,
                  color: active ? 'var(--brass-300)' : 'var(--sand-300)',
                }}
              >
                {mode.label}
              </button>
            )
          })}
        </div>

        <Button variant="primary" onClick={onStart} style={{ width: '100%', padding: '13px 0', fontSize: 14, letterSpacing: '0.05em' }}>
          Start
        </Button>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 20 }}>
          <LinkBtn onClick={onOpenInstructions}>How to Play</LinkBtn>
          <LinkBtn onClick={onOpenLeaderboard}>Leaderboard</LinkBtn>
          <LinkBtn onClick={onOpenAbout}>About</LinkBtn>
        </div>
      </div>
    </div>
  )
}

function LinkBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="btn"
      onClick={onClick}
      style={{ background: 'transparent', border: 'none', color: 'var(--stone-400)', fontSize: 12, padding: 4 }}
    >
      {children}
    </button>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 30,
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: 'rgba(6,7,8,0.5)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
}

const card: React.CSSProperties = {
  width: 'min(440px, 92vw)',
  textAlign: 'center',
  padding: '44px 40px',
  borderRadius: 'var(--radius-lg)',
}
