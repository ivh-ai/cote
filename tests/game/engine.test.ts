import { describe, it, expect } from 'vitest'
import {
  applyGuess,
  displaySeconds,
  giveUp,
  initialState,
  isCountdown,
  isPerfect,
  reset,
  setTimerIdx,
  tick,
  type GameState,
} from '../../src/game/engine'
import { ALL_COUNTRIES, BY_CONTINENT, TOTAL } from '../../src/game/countries'
import { TIMER_MODES } from '../../src/game/constants'

const IDX_30 = TIMER_MODES.findIndex((m) => m.total === 1800)
const IDX_INF = TIMER_MODES.findIndex((m) => m.total === null)

describe('initialState / mode helpers', () => {
  it('starts idle, empty, zeroed', () => {
    const s = initialState(IDX_INF)
    expect(s.status).toBe('idle')
    expect(s.foundIds.size).toBe(0)
    expect(s.seconds).toBe(0)
  })
  it('isCountdown reflects the mode', () => {
    expect(isCountdown(IDX_30)).toBe(true)
    expect(isCountdown(IDX_INF)).toBe(false)
  })
  it('displaySeconds counts up for unlimited, down for countdown', () => {
    const up: GameState = { status: 'playing', foundIds: new Set(), seconds: 12, timerIdx: IDX_INF }
    expect(displaySeconds(up)).toBe(12)
    const down: GameState = { status: 'playing', foundIds: new Set(), seconds: 12, timerIdx: IDX_30 }
    expect(displaySeconds(down)).toBe(1800 - 12)
  })
})

describe('applyGuess', () => {
  it('accepts an exact match and flips to playing', () => {
    const { next, outcome } = applyGuess(initialState(IDX_INF), 'France', false)
    expect(outcome.kind).toBe('found')
    expect(next.status).toBe('playing')
    expect(next.foundIds.size).toBe(1)
  })
  it('does not fuzzy-match on typing (exact only)', () => {
    const { outcome } = applyGuess(initialState(IDX_INF), 'germny', false)
    expect(outcome.kind).toBe('none')
  })
  it('fuzzy-matches on Enter', () => {
    const { outcome } = applyGuess(initialState(IDX_INF), 'germny', true)
    expect(outcome.kind).toBe('found')
  })
  it('reports duplicates without changing state', () => {
    const first = applyGuess(initialState(IDX_INF), 'France', false).next
    const { next, outcome } = applyGuess(first, 'France', false)
    expect(outcome.kind).toBe('duplicate')
    expect(next.foundIds.size).toBe(1)
  })
  it('reports invalid only on Enter with non-empty input', () => {
    expect(applyGuess(initialState(IDX_INF), 'zzzz', true).outcome.kind).toBe('invalid')
    expect(applyGuess(initialState(IDX_INF), 'zzzz', false).outcome.kind).toBe('none')
    expect(applyGuess(initialState(IDX_INF), '', true).outcome.kind).toBe('none')
  })
  it('is a no-op when finished', () => {
    const finished: GameState = { status: 'finished', foundIds: new Set(), seconds: 0, timerIdx: IDX_INF }
    expect(applyGuess(finished, 'France', false).outcome.kind).toBe('none')
  })
  it('emits a continent badge on completion', () => {
    let s = initialState(IDX_INF)
    const oceania = BY_CONTINENT.oceania
    let last
    for (const c of oceania) {
      const r = applyGuess(s, c.name, false)
      s = r.next
      last = r.outcome
    }
    expect(last?.kind).toBe('found')
    if (last?.kind === 'found') {
      expect(last.continentComplete).toBe(true)
      expect(last.badge.kind).toBe('continent')
    }
  })
  it('emits a milestone badge at 25', () => {
    let s = initialState(IDX_INF)
    let last
    for (const c of ALL_COUNTRIES.slice(0, 25)) {
      const r = applyGuess(s, c.name, false)
      s = r.next
      last = r.outcome
    }
    if (last?.kind === 'found') expect(last.badge.kind).toBe('milestone')
  })
  it('finishes and flags perfect at TOTAL', () => {
    let s = initialState(IDX_INF)
    for (const c of ALL_COUNTRIES) s = applyGuess(s, c.name, false).next
    expect(s.status).toBe('finished')
    expect(isPerfect(s)).toBe(true)
    expect(s.foundIds.size).toBe(TOTAL)
  })
})

describe('tick', () => {
  it('increments only while playing', () => {
    const idle = initialState(IDX_INF)
    expect(tick(idle).seconds).toBe(0)
    const playing: GameState = { ...idle, status: 'playing' }
    expect(tick(playing).seconds).toBe(1)
  })
  it('finishes a countdown at its budget', () => {
    const almost: GameState = { status: 'playing', foundIds: new Set(), seconds: 1799, timerIdx: IDX_30 }
    const next = tick(almost)
    expect(next.seconds).toBe(1800)
    expect(next.status).toBe('finished')
  })
  it('never finishes unlimited on time', () => {
    const s: GameState = { status: 'playing', foundIds: new Set(), seconds: 99999, timerIdx: IDX_INF }
    expect(tick(s).status).toBe('playing')
  })
})

describe('giveUp / reset / setTimerIdx', () => {
  it('giveUp finishes', () => {
    expect(giveUp({ ...initialState(IDX_INF), status: 'playing' }).status).toBe('finished')
  })
  it('reset returns a fresh idle state with the given mode', () => {
    const s = reset(IDX_30)
    expect(s.status).toBe('idle')
    expect(s.timerIdx).toBe(IDX_30)
    expect(s.foundIds.size).toBe(0)
  })
  it('setTimerIdx only works while idle', () => {
    expect(setTimerIdx(initialState(IDX_INF), IDX_30).timerIdx).toBe(IDX_30)
    const playing: GameState = { ...initialState(IDX_INF), status: 'playing' }
    expect(setTimerIdx(playing, IDX_30).timerIdx).toBe(IDX_INF)
  })
})
