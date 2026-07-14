/** How to play. See 02 §7. */
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { TOTAL } from '../../game/countries'

const STEPS: [string, string][] = [
  ['Name all countries', `Type any of the ${TOTAL} country names in the box. Correct answers are accepted instantly — no need to press Enter.`],
  ['We’re forgiving', 'Common names and abbreviations work (USA, Britain), and small typos are accepted. Not quite right? We’ll suggest “Did you mean…?”'],
  ['Countries light up', 'Each correct answer reveals its topographic colour on the globe — greens for forests, gold for deserts, brown for mountains.'],
  ['Spin & zoom', 'Drag the globe to rotate it. Scroll or double-click to zoom in; double-click again to zoom out.'],
  ['Choose your timer', '10, 20, or 30 minutes on the clock — or ∞ for unlimited time.'],
  ['Give up anytime', 'Stuck? Give Up reveals the countries you missed, in red.'],
]

export function InstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to Play" onClose={onClose} maxWidth={520} footer={<Button variant="primary" onClick={onClose} style={{ width: '100%' }}>Got it</Button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {STEPS.map(([title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brass-400)', flexShrink: 0, marginTop: 6 }} />
            <div>
              <div style={{ color: 'var(--sand-50)', fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{title}</div>
              <div style={{ color: 'var(--stone-400)', fontSize: 12, lineHeight: 1.65 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
