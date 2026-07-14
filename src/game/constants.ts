/** Game constants — see 05_GAME_ENGINE_SPECIFICATION.md §3, §9. No magic numbers elsewhere. */

export interface TimerMode {
  label: string
  /** Total seconds for countdown modes; null = Unlimited (count-up). */
  total: number | null
}

export const TIMER_MODES: TimerMode[] = [
  { label: '10 min', total: 600 },
  { label: '20 min', total: 1200 },
  { label: '30 min', total: 1800 },
  { label: '∞', total: null },
]

/** Default selected mode index (30-minute challenge — a bounded, shareable run). */
export const DEFAULT_TIMER_IDX = 2

/** Found-count milestones that trigger the celebratory badge. */
export const MILESTONES: number[] = [25, 50, 100, 150, 175]

/** Badge display durations (ms). */
export const BADGE_MS = 2500
export const CONTINENT_BADGE_MS = 3500
export const FEEDBACK_MS = 2000

/** Timer thresholds (seconds remaining) for warn/critical styling. */
export const TIME_WARN_S = 60
export const TIME_CRITICAL_S = 10

/** Minimum input length before fuzzy/suggestion matching engages. */
export const MIN_MATCH_LEN = 3
/** Suggestion similarity threshold (0..1). */
export const SUGGEST_THRESHOLD = 0.75
