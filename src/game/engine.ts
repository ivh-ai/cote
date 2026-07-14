/**
 * Pure game engine — state transitions with no React/DOM. See 05_GAME_ENGINE_SPECIFICATION.md §2, §7–§10.
 * The hook (useGameState) wraps these with React state, timers, globe bridge, and persistence.
 */
import { TIMER_MODES } from './constants'
import {
  CONTINENT_OF,
  CONTINENTS,
  TOTAL,
  type Country,
} from './countries'
import { exactMatch, fuzzyMatch, type Lookup } from './matching'
import { isContinentComplete, checkMilestone } from './milestones'

export type GameStatus = 'idle' | 'playing' | 'finished'

export interface GameState {
  status: GameStatus
  foundIds: Set<string>
  seconds: number
  timerIdx: number
}

export type BadgeKind = 'country' | 'milestone' | 'continent'

export interface Badge {
  text: string
  kind: BadgeKind
}

export type GuessOutcome =
  | { kind: 'found'; country: Country; badge: Badge; continentComplete: boolean; perfect: boolean }
  | { kind: 'duplicate'; country: Country }
  | { kind: 'invalid' }
  | { kind: 'none' }

export function initialState(timerIdx: number): GameState {
  return { status: 'idle', foundIds: new Set(), seconds: 0, timerIdx }
}

export function isCountdown(timerIdx: number): boolean {
  return TIMER_MODES[timerIdx]?.total !== null
}

export function displaySeconds(state: GameState): number {
  const total = TIMER_MODES[state.timerIdx]?.total
  return total == null ? state.seconds : Math.max(0, total - state.seconds)
}

/** Compute the badge for a newly found country. */
function badgeFor(country: Country, foundIds: Set<string>): { badge: Badge; continentComplete: boolean } {
  const contKey = CONTINENT_OF[country.id]
  const contLabel = CONTINENTS.find((c) => c.key === contKey)?.label ?? contKey
  const complete = isContinentComplete(contKey, foundIds)
  if (complete) {
    return { badge: { text: `${contLabel} complete!`, kind: 'continent' }, continentComplete: true }
  }
  if (checkMilestone(foundIds.size)) {
    return { badge: { text: `${foundIds.size} / ${TOTAL} found!`, kind: 'milestone' }, continentComplete: false }
  }
  return { badge: { text: country.name, kind: 'country' }, continentComplete: false }
}

/**
 * Apply a guess. `viaEnter` enables fuzzy (1-error) matching; typing uses exact-only
 * to avoid premature mid-word triggers (doc 05 §4.4).
 * Returns the next state and an outcome describing what happened.
 */
export function applyGuess(
  state: GameState,
  input: string,
  viaEnter: boolean,
  lookup?: Lookup,
): { next: GameState; outcome: GuessOutcome } {
  if (state.status === 'finished') return { next: state, outcome: { kind: 'none' } }

  const country = viaEnter ? fuzzyMatch(input, lookup) : exactMatch(input, lookup)
  if (!country) {
    // On Enter with non-empty, unrecognized input → invalid feedback.
    const invalid = viaEnter && input.trim().length > 0
    return { next: state, outcome: invalid ? { kind: 'invalid' } : { kind: 'none' } }
  }

  if (state.foundIds.has(country.id)) {
    return { next: state, outcome: { kind: 'duplicate', country } }
  }

  const foundIds = new Set(state.foundIds)
  foundIds.add(country.id)
  const perfect = foundIds.size >= TOTAL
  const { badge, continentComplete } = badgeFor(country, foundIds)

  const next: GameState = {
    ...state,
    status: perfect ? 'finished' : 'playing',
    foundIds,
  }
  return { next, outcome: { kind: 'found', country, badge, continentComplete, perfect } }
}

/** Advance the timer by one second; countdown modes finish at their budget. */
export function tick(state: GameState): GameState {
  if (state.status !== 'playing') return state
  const seconds = state.seconds + 1
  const total = TIMER_MODES[state.timerIdx]?.total
  const finished = total != null && seconds >= total
  return { ...state, seconds, status: finished ? 'finished' : 'playing' }
}

export function giveUp(state: GameState): GameState {
  return { ...state, status: 'finished' }
}

export function reset(timerIdx: number): GameState {
  return initialState(timerIdx)
}

/** Change timer mode — only permitted while idle (mode locks once playing). */
export function setTimerIdx(state: GameState, timerIdx: number): GameState {
  if (state.status !== 'idle') return state
  return { ...state, timerIdx }
}

/** True when the game finished with every country found. */
export function isPerfect(state: GameState): boolean {
  return state.status === 'finished' && state.foundIds.size >= TOTAL
}
