/** About / credits. See 02 §12. */
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { TOTAL } from '../../game/countries'

export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="About COTE" onClose={onClose} maxWidth={500} footer={<Button variant="primary" onClick={onClose} style={{ width: '100%' }}>Close</Button>}>
      <p style={{ color: 'var(--sand-100)', fontSize: 13, lineHeight: 1.75, margin: '0 0 12px' }}>
        <strong>COTE — Countries of the Earth</strong> is a premium geography game: name all {TOTAL} countries from
        memory while they illuminate on a photorealistic globe.
      </p>
      <p style={{ color: 'var(--stone-400)', fontSize: 13, lineHeight: 1.75, margin: '0 0 16px' }}>
        The country set includes {TOTAL} sovereign entities. Inclusion choices (e.g. Taiwan, Kosovo, Palestine, Vatican
        City) follow common geography-quiz convention; Antarctica is excluded. Map geometry is Natural Earth data via
        world-atlas.
      </p>
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--stone-400)', marginBottom: 8 }}>Credits</div>
        <p style={{ color: 'var(--sand-100)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
          Built with React, React Three Fiber, and Three.js. Rendering combines Apple-quality restraint with
          National Geographic realism. Leaderboard powered by Supabase.
        </p>
      </div>
    </Modal>
  )
}
