/** Transient top-center badge + achievement toasts. See 02 §4.1, 04 §3.7/§3.13. */
import type { Badge } from '../../game/engine'
import { ACHIEVEMENTS } from '../../game/achievements'

export function TransientLayer({ badge, achievements }: { badge: Badge | null; achievements: string[] }) {
  const isMilestone = badge?.kind !== 'country'
  return (
    <div style={{ position: 'absolute', top: 82, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', zIndex: 20 }}>
      {badge && (
        <div
          className="badge-in glass"
          style={{
            padding: isMilestone ? '9px 24px' : '7px 20px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: isMilestone ? 14 : 13,
            color: isMilestone ? 'var(--brass-300)' : 'var(--success)',
            border: `1px solid ${isMilestone ? 'var(--brass-400)' : 'var(--success)'}`,
            whiteSpace: 'nowrap',
          }}
          role="status"
        >
          {isMilestone ? '★ ' : '✓ '}
          {badge.text}
        </div>
      )}
      {achievements.map((id) => {
        const a = ACHIEVEMENTS.find((x) => x.id === id)
        if (!a) return null
        return (
          <div
            key={id}
            className="badge-in glass"
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--brass-400)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            role="status"
          >
            <span style={{ color: 'var(--brass-300)', fontSize: 15 }}>🏅</span>
            <span style={{ color: 'var(--sand-50)', fontWeight: 700, fontSize: 13 }}>{a.name}</span>
            <span style={{ color: 'var(--stone-400)', fontSize: 12 }}>unlocked</span>
          </div>
        )
      })}
    </div>
  )
}
