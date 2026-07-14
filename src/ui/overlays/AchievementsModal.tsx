/** Achievements grid — earned vs locked (progressive disclosure). See 02 §10, 03 §16. */
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { ACHIEVEMENTS } from '../../game/achievements'
import { loadAchievements } from '../../services/storage'

export function AchievementsModal({ onClose }: { onClose: () => void }) {
  const earned = loadAchievements()
  return (
    <Modal title="Achievements" onClose={onClose} maxWidth={520} footer={<Button variant="primary" onClick={onClose} style={{ width: '100%' }}>Close</Button>}>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--stone-400)' }}>
        {earned.size} of {ACHIEVEMENTS.length} unlocked
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ACHIEVEMENTS.map((a) => {
          const has = earned.has(a.id)
          return (
            <div
              key={a.id}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-1)',
                border: `1px solid ${has ? 'var(--brass-400)' : 'var(--glass-border)'}`,
                opacity: has ? 1 : 0.5,
              }}
            >
              <span style={{ fontSize: 18 }}>{has ? '🏅' : '🔒'}</span>
              <div>
                <div style={{ color: 'var(--sand-50)', fontWeight: 600, fontSize: 12 }}>{a.name}</div>
                <div style={{ color: 'var(--stone-400)', fontSize: 11, lineHeight: 1.5, marginTop: 2 }}>
                  {has ? a.description : a.hint}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
