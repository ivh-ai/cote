/** Results / Perfect surface. See 02 §5, 05 §17. */
import { useState } from 'react'
import { BY_CONTINENT, CONTINENTS, TOTAL, type ContinentKey } from '../../game/countries'
import { TIMER_MODES } from '../../game/constants'
import { formatTime } from '../../game/scoring'
import { copyText } from '../../lib/clipboard'
import { submitScore } from '../../services/leaderboard'
import { saveLastName } from '../../services/storage'
import { Button } from '../components/Button'

interface ResultsScreenProps {
  perfect: boolean
  count: number
  seconds: number
  timerIdx: number
  foundIds: Set<string>
  initialName: string
  onPlayAgain: () => void
  onOpenLeaderboard: () => void
}

export function ResultsScreen({
  perfect,
  count,
  seconds,
  timerIdx,
  foundIds,
  initialName,
  onPlayAgain,
  onOpenLeaderboard,
}: ResultsScreenProps) {
  const [expanded, setExpanded] = useState<ContinentKey | null>(null)
  const [name, setName] = useState(initialName)
  const [shareLabel, setShareLabel] = useState('Share')
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const pct = Math.round((count / TOTAL) * 100)
  const modeLabel = TIMER_MODES[timerIdx]?.label ?? '∞'

  const share = async () => {
    const text = `COTE 🌍 ${count}/${TOTAL} countries in ${formatTime(seconds)} (${modeLabel} mode)`
    const ok = await copyText(text)
    setShareLabel(ok ? 'Copied ✓' : 'Copy failed')
    setTimeout(() => setShareLabel('Share'), 1800)
  }

  const submit = async () => {
    setSubmitState('saving')
    saveLastName(name.trim())
    const mode = timerIdx === TIMER_MODES.length - 1 ? 'infinite' : String(TIMER_MODES[timerIdx].total! / 60)
    const res = await submitScore(name, count, seconds, mode)
    setSubmitState(res.ok ? 'done' : 'error')
  }

  return (
    <div style={overlay}>
      <div className="glass modal-in scroll-thin" style={card}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {perfect ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🌍</div>
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: 'var(--brass-300)' }}>Perfect.</h1>
              <p style={{ margin: '6px 0 0', color: 'var(--sand-100)', fontSize: 15 }}>
                All {TOTAL} countries in {formatTime(seconds)}.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--sand-50)' }}>Session Results</h1>
              <p style={{ margin: '4px 0 0', color: 'var(--stone-400)', fontSize: 12 }}>Well played.</p>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          <StatCard label="Time" value={formatTime(seconds)} />
          <StatCard label="Countries" value={`${count} / ${TOTAL}`} />
          <StatCard label="Completion" value={`${pct}%`} />
        </div>

        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stone-400)', marginBottom: 10 }}>
          Breakdown by region
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 20 }}>
          {CONTINENTS.map(({ key, label }) => {
            const all = BY_CONTINENT[key]
            const found = all.filter((c) => foundIds.has(c.id))
            const missed = all.filter((c) => !foundIds.has(c.id))
            const rpct = Math.round((found.length / all.length) * 100)
            const open = expanded === key
            return (
              <div key={key} style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <button
                  type="button"
                  className="btn row-hover"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : key)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--surface-1)', border: 'none', borderRadius: 0 }}
                >
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--sand-100)' }}>{label}</span>
                  <span style={{ fontSize: 11, color: 'var(--stone-400)' }}>{found.length} / {all.length}</span>
                  <div style={{ width: 56, height: 3, background: 'var(--surface-3)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${rpct}%`, background: rpct === 100 ? 'var(--brass-400)' : 'var(--ocean-500)', borderRadius: 2 }} />
                  </div>
                  <span style={{ color: 'var(--stone-400)', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
                </button>
                {open && (
                  <div style={{ padding: '10px 12px', background: 'var(--canvas)', borderTop: '1px solid var(--glass-border)' }}>
                    {found.length > 0 && <ChipRow title={`Correct (${found.length})`} color="var(--success)" bg="var(--success-bg)" items={found.map((c) => c.name)} />}
                    {missed.length > 0 && <ChipRow title={`Missed (${missed.length})`} color="var(--danger)" bg="var(--danger-bg)" items={missed.map((c) => c.name)} />}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {submitState !== 'done' && (
          <input
            className="input"
            type="text"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name for the leaderboard…"
            aria-label="Leaderboard name"
            style={{ width: '100%', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}
          />
        )}
        {submitState === 'error' && (
          <p role="alert" style={{ margin: '0 0 12px', color: 'var(--danger)', fontSize: 12 }}>
            Couldn’t submit — your game is saved locally. You can try again.
          </p>
        )}
        {submitState === 'done' && (
          <p style={{ margin: '0 0 12px', color: 'var(--success)', fontSize: 12 }}>
            Submitted!{' '}
            <button type="button" className="btn" onClick={onOpenLeaderboard} style={{ background: 'none', border: 'none', color: 'var(--brass-300)', padding: 0, fontSize: 12 }}>
              View leaderboard →
            </button>
          </p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={share} style={{ flex: 1 }}>{shareLabel}</Button>
          {submitState !== 'done' ? (
            <Button variant="primary" onClick={submit} disabled={submitState === 'saving'} style={{ flex: 2 }}>
              {submitState === 'saving' ? 'Submitting…' : 'Submit Score'}
            </Button>
          ) : (
            <Button variant="primary" onClick={onPlayAgain} style={{ flex: 2 }}>Play Again</Button>
          )}
        </div>
        {submitState !== 'done' && (
          <Button variant="secondary" onClick={onPlayAgain} style={{ width: '100%', marginTop: 10 }}>Play Again</Button>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '11px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stone-400)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--sand-50)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

function ChipRow({ title, color, bg, items }: { title: string; color: string; bg: string; items: string[] }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color, marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {items.map((n) => (
          <span key={n} style={{ background: bg, border: `1px solid ${color}`, color, borderRadius: 'var(--radius-xs)', padding: '2px 8px', fontSize: 11 }}>{n}</span>
        ))}
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 35,
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: 'rgba(6,7,8,0.55)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
}

const card: React.CSSProperties = {
  width: 'min(480px, 94vw)',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '28px 32px',
  borderRadius: 'var(--radius-lg)',
}
