/** Continent tabs + country chips. See 02 §4.1, 03 §12. */
import { useState } from 'react'
import { BY_CONTINENT, CONTINENTS, type ContinentKey } from '../../game/countries'

interface ContinentPanelProps {
  foundIds: Set<string>
  finished: boolean
}

export function ContinentPanel({ foundIds, finished }: ContinentPanelProps) {
  const [active, setActive] = useState<ContinentKey>('north_america')
  const list = BY_CONTINENT[active]

  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', width: 'min(720px, 92vw)' }}>
      <div style={{ display: 'flex' }} role="tablist" aria-label="Continents">
        {CONTINENTS.map(({ key, label }) => {
          const total = BY_CONTINENT[key].length
          const found = BY_CONTINENT[key].filter((c) => foundIds.has(c.id)).length
          const isActive = active === key
          const complete = found === total
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className="btn tab"
              onClick={() => setActive(key)}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: 0,
                background: isActive ? 'rgba(245,240,230,0.05)' : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--brass-400)' : 'transparent'}`,
                color: isActive ? 'var(--sand-50)' : 'var(--stone-400)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              <div>{label}</div>
              <div style={{ fontSize: 10, marginTop: 1, color: complete ? 'var(--brass-400)' : 'var(--stone-400)' }}>
                {found}/{total}
              </div>
            </button>
          )
        })}
      </div>

      <div
        className="scroll-thin"
        role="tabpanel"
        style={{ height: 116, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 5, alignContent: 'flex-start' }}
      >
        {list.map((country) => {
          const isFound = foundIds.has(country.id)
          const isMissed = finished && !isFound
          const revealed = isFound || isMissed
          const bg = isFound ? 'var(--success-bg)' : isMissed ? 'var(--danger-bg)' : 'var(--surface-2)'
          const border = isFound ? 'var(--success)' : isMissed ? 'var(--danger)' : 'var(--glass-border)'
          const color = isFound ? 'var(--success)' : isMissed ? 'var(--danger)' : 'var(--stone-400)'
          return (
            <span
              key={country.id}
              className="chip"
              aria-label={revealed ? `${country.name} — ${isFound ? 'found' : 'missed'}` : 'unknown country'}
              style={{
                padding: '2px 9px',
                borderRadius: 'var(--radius-xs)',
                fontSize: 11,
                fontWeight: isFound ? 500 : 400,
                background: bg,
                border: `1px solid ${border}`,
                color,
                whiteSpace: 'nowrap',
              }}
            >
              {revealed ? country.name : '· · ·'}
            </span>
          )
        })}
      </div>
    </div>
  )
}
