/** Achievement system — pure & idempotent. See 05_GAME_ENGINE_SPECIFICATION.md §12. */
import { CONTINENTS, TOTAL, type ContinentKey } from './countries'
import { isContinentComplete } from './milestones'

export interface AchievementContext {
  count: number
  seconds: number
  /** TIMER_MODES label, e.g. '30 min' | '∞'. */
  mode: string
  found: Set<string>
  /** Whether this mode is a countdown (has a time budget). */
  isCountdown: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  hint: string
  test: (ctx: AchievementContext) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_ten', name: 'Getting Started', description: 'Find 10 countries in a game.', hint: 'Find your first handful.', test: (c) => c.count >= 10 },
  { id: 'half_century', name: 'Half Century', description: 'Find 50 countries.', hint: 'Keep going…', test: (c) => c.count >= 50 },
  { id: 'century', name: 'Centurion', description: 'Find 100 countries.', hint: 'Reach triple digits.', test: (c) => c.count >= 100 },
  { id: 'sesqui', name: '150 Club', description: 'Find 150 countries.', hint: 'Almost there.', test: (c) => c.count >= 150 },
  { id: 'perfect', name: 'Cartographer', description: `Find all ${TOTAL} countries.`, hint: 'Complete the world.', test: (c) => c.count >= TOTAL },
  { id: 'speed_100_10m', name: 'Quickfire', description: 'Find 100 countries within 10 minutes.', hint: 'Speed matters.', test: (c) => c.count >= 100 && c.seconds <= 600 },
  {
    id: 'flawless_30',
    name: 'Beat the Clock',
    description: 'Find every country in the 30-minute mode.',
    hint: 'Perfect, against the clock.',
    test: (c) => c.count >= TOTAL && c.mode === '30 min',
  },
  ...CONTINENTS.map((cont) => ({
    id: `cont_${cont.key}` as string,
    name: `${cont.label} Complete`,
    description: `Find every country in ${cont.label}.`,
    hint: `Complete ${cont.label}.`,
    test: (c: AchievementContext) => isContinentComplete(cont.key as ContinentKey, c.found),
  })),
]

/**
 * Returns the ids newly unlocked given the context and the already-unlocked set.
 * Idempotent: re-running with the same unlocked set returns [].
 */
export function evaluateAchievements(
  ctx: AchievementContext,
  unlocked: Set<string> = new Set(),
): string[] {
  const newly: string[] = []
  for (const a of ACHIEVEMENTS) {
    if (!unlocked.has(a.id) && a.test(ctx)) newly.push(a.id)
  }
  return newly
}
