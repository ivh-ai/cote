/** Scoring & time formatting — pure. See 05_GAME_ENGINE_SPECIFICATION.md §14. */

/** Leaderboard score: more countries dominates; ties broken by lower time. */
export function computeScore(countries: number, seconds: number): number {
  return countries * 1000 - seconds
}

/** Seconds → MM:SS (zero-padded). Clamps negatives to 0. */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}
