/** Personal statistics (local). See 02 §11. */
import { useState } from 'react'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { loadStats, resetStats } from '../../services/storage'
import { formatTime } from '../../game/scoring'

export function StatsModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState(loadStats)
  const [confirming, setConfirming] = useState(false)

  if (stats.gamesPlayed === 0) {
    return (
      <Modal title="Statistics" onClose={onClose} maxWidth={460} footer={<Button variant="primary" onClick={onClose} style={{ width: '100%' }}>Close</Button>}>
        <div style={{ textAlign: 'center', color: 'var(--stone-400)', fontSize: 13, padding: '24px 0' }}>
          Play your first game to start tracking your stats.
        </div>
      </Modal>
    )
  }

  const cells: [string, string][] = [
    ['Games played', String(stats.gamesPlayed)],
    ['Best count', `${stats.bestCount} / 197`],
    ['Perfect games', String(stats.perfectGames)],
    ['Fastest perfect', stats.bestPerfectSeconds != null ? formatTime(stats.bestPerfectSeconds) : '—'],
  ]

  return (
    <Modal
      title="Statistics"
      onClose={onClose}
      maxWidth={460}
      footer={
        confirming ? (
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="danger" onClick={() => { resetStats(); setStats(loadStats()); setConfirming(false) }} style={{ flex: 1 }}>Confirm reset</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setConfirming(true)} style={{ flex: 1 }}>Reset stats</Button>
            <Button variant="primary" onClick={onClose} style={{ flex: 2 }}>Close</Button>
          </>
        )
      }
    >
      {confirming && (
        <p role="alert" style={{ color: 'var(--danger)', fontSize: 12, margin: '0 0 12px' }}>
          Clear all your statistics? This can’t be undone.
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cells.map(([label, value]) => (
          <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '14px 12px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stone-400)', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--sand-50)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
