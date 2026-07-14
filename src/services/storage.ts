/**
 * Versioned localStorage — stats, achievements, prefs. See 05_GAME_ENGINE_SPECIFICATION.md §11.
 * Shapes are designed to migrate to Supabase accounts later without a breaking change.
 * All access is safe: parse failures and unavailable storage degrade to defaults.
 */

const STATS_KEY = 'cote_stats_v1'
const ACHIEVEMENTS_KEY = 'cote_achievements_v1'
const ONBOARDED_KEY = 'cote_onboarded'
const LAST_NAME_KEY = 'cote_lastName'

export interface GameRecord {
  mode: string
  count: number
  seconds: number
  dateISO: string
}

export interface Stats {
  gamesPlayed: number
  perfectGames: number
  bestCount: number
  /** Time (s) achieved on the run with `bestCount`. */
  bestCountSeconds: number
  /** Fastest full 197 (s), or null if never perfect. */
  bestPerfectSeconds: number | null
  perContinentBest: Record<string, number>
  lastPlayedISO: string | null
  history: GameRecord[]
}

const MAX_HISTORY = 50

export const emptyStats = (): Stats => ({
  gamesPlayed: 0,
  perfectGames: 0,
  bestCount: 0,
  bestCountSeconds: 0,
  bestPerfectSeconds: null,
  perContinentBest: {},
  lastPlayedISO: null,
  history: [],
})

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable / quota — degrade silently */
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return { ...fallback, ...(JSON.parse(raw) as object) } as T
  } catch {
    return fallback
  }
}

// ── Stats ────────────────────────────────────────────────────────────────────

export function loadStats(): Stats {
  return safeParse<Stats>(safeGet(STATS_KEY), emptyStats())
}

export interface FinishedGame {
  mode: string
  count: number
  seconds: number
  perfect: boolean
  perContinent: Record<string, number>
}

/** Pure: fold a finished game into an existing stats object (returns a new object). */
export function foldGame(prev: Stats, game: FinishedGame, now = new Date()): Stats {
  const dateISO = now.toISOString()
  const better = game.count > prev.bestCount
  const perContinentBest = { ...prev.perContinentBest }
  for (const [k, v] of Object.entries(game.perContinent)) {
    perContinentBest[k] = Math.max(perContinentBest[k] ?? 0, v)
  }
  const bestPerfectSeconds = game.perfect
    ? prev.bestPerfectSeconds == null
      ? game.seconds
      : Math.min(prev.bestPerfectSeconds, game.seconds)
    : prev.bestPerfectSeconds
  return {
    gamesPlayed: prev.gamesPlayed + 1,
    perfectGames: prev.perfectGames + (game.perfect ? 1 : 0),
    bestCount: better ? game.count : prev.bestCount,
    bestCountSeconds: better ? game.seconds : prev.bestCountSeconds,
    bestPerfectSeconds,
    perContinentBest,
    lastPlayedISO: dateISO,
    history: [
      { mode: game.mode, count: game.count, seconds: game.seconds, dateISO },
      ...prev.history,
    ].slice(0, MAX_HISTORY),
  }
}

export function recordGame(game: FinishedGame): Stats {
  const next = foldGame(loadStats(), game)
  safeSet(STATS_KEY, JSON.stringify(next))
  return next
}

export function resetStats(): void {
  safeSet(STATS_KEY, JSON.stringify(emptyStats()))
}

// ── Achievements ───────────────────────────────────────────────────────────────

export function loadAchievements(): Set<string> {
  const raw = safeGet(ACHIEVEMENTS_KEY)
  if (!raw) return new Set()
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? new Set(arr as string[]) : new Set()
  } catch {
    return new Set()
  }
}

export function saveAchievements(ids: Set<string>): void {
  safeSet(ACHIEVEMENTS_KEY, JSON.stringify([...ids]))
}

// ── Prefs ──────────────────────────────────────────────────────────────────────

export function hasOnboarded(): boolean {
  return safeGet(ONBOARDED_KEY) === '1'
}
export function setOnboarded(): void {
  safeSet(ONBOARDED_KEY, '1')
}

export function loadLastName(): string {
  return safeGet(LAST_NAME_KEY) ?? ''
}
export function saveLastName(name: string): void {
  safeSet(LAST_NAME_KEY, name)
}
