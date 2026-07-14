/** Leaderboard modal — fetches on open, graceful empty/error states. See 02 §9. */
import { useEffect, useState } from 'react'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { getTop, type LeaderboardEntry } from '../../services/leaderboard'
import { formatTime } from '../../game/scoring'
import { TOTAL } from '../../game/countries'

export function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  const load = () => {
    setState('loading')
    getTop(10).then((res) => {
      if (res.ok) {
        setEntries(res.data)
        setState('ready')
      } else {
        setState('error')
      }
    })
  }
  useEffect(load, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <Modal title="Leaderboard" onClose={onClose} maxWidth={460} footer={<Button variant="primary" onClick={onClose} style={{ width: '100%' }}>Close</Button>}>
      <p style={{ margin: '0 0 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--stone-400)' }}>
        Top 10 all-time
      </p>
      {state === 'loading' && <Centered>Loading…</Centered>}
      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p role="alert" style={{ color: 'var(--stone-400)', fontSize: 13, marginBottom: 12 }}>Leaderboard unavailable right now.</p>
          <Button variant="secondary" onClick={load}>Retry</Button>
        </div>
      )}
      {state === 'ready' && entries.length === 0 && <Centered>Be the first to make the board.</Centered>}
      {state === 'ready' && entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {entries.map((e, i) => {
            const top3 = i < 3
            return (
              <div
                key={`${e.name}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: top3 ? '11px 14px' : '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: top3 ? 'rgba(217,164,65,0.08)' : 'var(--surface-1)',
                  border: `1px solid ${top3 ? 'var(--brass-400)' : 'var(--glass-border)'}`,
                }}
              >
                <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
                  {top3 ? <span style={{ fontSize: 16 }}>{medals[i]}</span> : <span style={{ color: 'var(--stone-400)', fontSize: 12, fontWeight: 600 }}>{i + 1}</span>}
                </div>
                <div style={{ flex: 1, color: top3 ? 'var(--brass-300)' : 'var(--sand-100)', fontWeight: top3 ? 700 : 500, fontSize: 13 }}>{e.name}</div>
                <div style={{ color: 'var(--stone-400)', fontSize: 12 }}>{e.countries} / {TOTAL}</div>
                <div style={{ color: top3 ? 'var(--brass-300)' : 'var(--stone-400)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{formatTime(e.seconds)}</div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ textAlign: 'center', color: 'var(--stone-400)', fontSize: 13, padding: '24px 0' }}>{children}</div>
}
