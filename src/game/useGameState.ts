/**
 * useGameState — the single hook wiring the pure engine to the globe bridge and
 * persistence. See 05_GAME_ENGINE_SPECIFICATION.md and 07_TECHNICAL_ARCHITECTURE.md §4.
 * Side effects (timers, globe, storage) live here; all decisions live in `engine.ts`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { GlobeApi } from '../globe/GlobeCanvas'
import {
  applyGuess,
  displaySeconds as calcDisplaySeconds,
  giveUp as engineGiveUp,
  initialState,
  isCountdown as calcIsCountdown,
  reset as engineReset,
  setTimerIdx as engineSetTimerIdx,
  tick,
  type Badge,
  type GameState,
  type GameStatus,
} from './engine'
import { suggestMatch } from './matching'
import { continentProgress } from './milestones'
import { evaluateAchievements } from './achievements'
import { BADGE_MS, CONTINENT_BADGE_MS, DEFAULT_TIMER_IDX, FEEDBACK_MS, TIMER_MODES } from './constants'
import { CONTINENTS, TOTAL, type Country } from './countries'
import { loadAchievements, recordGame, saveAchievements } from '../services/storage'

export type FeedbackKind = 'good' | 'bad' | 'neutral'
export interface Feedback {
  msg: string
  kind: FeedbackKind
}

export interface UseGameState {
  status: GameStatus
  foundIds: Set<string>
  count: number
  seconds: number
  displaySeconds: number
  timerIdx: number
  isCountdown: boolean
  perfect: boolean
  input: string
  badge: Badge | null
  feedback: Feedback | null
  suggestion: Country | null
  newAchievements: string[]
  // actions
  handleChange(value: string): void
  handleEnter(): void
  acceptSuggestion(country: Country): void
  setTimerIdx(i: number): void
  giveUp(): void
  reset(): void
}

export function useGameState(globeRef: RefObject<GlobeApi | null>): UseGameState {
  const [state, setState] = useState<GameState>(() => initialState(DEFAULT_TIMER_IDX))
  const [input, setInput] = useState('')
  const [badge, setBadge] = useState<Badge | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [suggestion, setSuggestion] = useState<Country | null>(null)
  const [newAchievements, setNewAchievements] = useState<string[]>([])

  const stateRef = useRef(state)
  const badgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const committed = useRef(false)

  const commit = useCallback((next: GameState) => {
    stateRef.current = next
    setState(next)
    globeRef.current?.updateCountries(next.foundIds, next.status)
    // globeRef is a stable ref — intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showBadge = useCallback((b: Badge) => {
    if (badgeTimer.current) clearTimeout(badgeTimer.current)
    setBadge(b)
    badgeTimer.current = setTimeout(
      () => setBadge(null),
      b.kind === 'continent' ? CONTINENT_BADGE_MS : BADGE_MS,
    )
  }, [])

  const showFeedback = useCallback((f: Feedback) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    setFeedback(f)
    feedbackTimer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS)
  }, [])

  const onFound = useCallback(
    (_country: Country, badgeToShow: Badge, next: GameState) => {
      commit(next)
      // Per-guess auto-rotate is intentionally omitted: repeatedly yanking the globe
      // fights the "never steal focus / no disorientation" motion guidance (04 §3.9).
      // The rotateToCountry API remains available for the end-of-game missed reveal.
      showBadge(badgeToShow)
      setFeedback(null)
      setInput('')
      setSuggestion(null)
    },
    [commit, showBadge],
  )

  const handleChange = useCallback(
    (value: string) => {
      const s = stateRef.current
      const base: GameState = s.status === 'idle' && value.trim() ? { ...s, status: 'playing' } : s
      const { next, outcome } = applyGuess(base, value, false)
      if (outcome.kind === 'found') {
        onFound(outcome.country, outcome.badge, next)
        return
      }
      if (base !== s) commit(base) // first keystroke started the game
      if (outcome.kind === 'duplicate') {
        showFeedback({ msg: 'Already found!', kind: 'neutral' })
        setInput('')
        setSuggestion(null)
        return
      }
      setInput(value)
      setSuggestion(value.trim().length >= 3 ? suggestMatch(value, s.foundIds) : null)
    },
    [commit, onFound, showFeedback],
  )

  const handleEnter = useCallback(() => {
    const s = stateRef.current
    const { next, outcome } = applyGuess(s, input, true)
    if (outcome.kind === 'found') {
      onFound(outcome.country, outcome.badge, next)
      return
    }
    if (outcome.kind === 'duplicate') {
      showFeedback({ msg: 'Already found!', kind: 'neutral' })
    } else if (outcome.kind === 'invalid') {
      showFeedback({ msg: 'Invalid entry', kind: 'bad' })
    }
    setInput('')
    setSuggestion(null)
  }, [input, onFound, showFeedback])

  const acceptSuggestion = useCallback(
    (country: Country) => {
      const s = stateRef.current
      const { next, outcome } = applyGuess(s, country.name, true)
      if (outcome.kind === 'found') onFound(outcome.country, outcome.badge, next)
      setInput('')
      setSuggestion(null)
    },
    [onFound],
  )

  const setTimerIdx = useCallback(
    (i: number) => commit(engineSetTimerIdx(stateRef.current, i)),
    [commit],
  )

  const giveUp = useCallback(() => commit(engineGiveUp(stateRef.current)), [commit])

  const reset = useCallback(() => {
    committed.current = false
    setBadge(null)
    setFeedback(null)
    setSuggestion(null)
    setNewAchievements([])
    setInput('')
    const next = engineReset(stateRef.current.timerIdx)
    commit(next)
    globeRef.current?.reset()
  }, [commit, globeRef])

  // Timer: exactly one interval while playing (strict-mode-safe — cleanup clears it).
  useEffect(() => {
    if (state.status !== 'playing') return
    const id = setInterval(() => commit(tick(stateRef.current)), 1000)
    return () => clearInterval(id)
  }, [state.status, state.timerIdx, commit])

  // Commit stats + achievements once when the game finishes (any path).
  useEffect(() => {
    if (state.status !== 'finished' || committed.current) return
    committed.current = true
    const s = stateRef.current
    const mode = TIMER_MODES[s.timerIdx]?.label ?? '∞'
    const perContinent: Record<string, number> = {}
    for (const { key } of CONTINENTS) perContinent[key] = continentProgress(key, s.foundIds).found
    const perfect = s.foundIds.size >= TOTAL
    recordGame({ mode, count: s.foundIds.size, seconds: s.seconds, perfect, perContinent })

    const already = loadAchievements()
    const newly = evaluateAchievements(
      { count: s.foundIds.size, seconds: s.seconds, mode, found: s.foundIds, isCountdown: calcIsCountdown(s.timerIdx) },
      already,
    )
    if (newly.length) {
      for (const id of newly) already.add(id)
      saveAchievements(already)
      setNewAchievements(newly)
    }
    globeRef.current?.updateCountries(s.foundIds, 'finished')
  }, [state.status, globeRef])

  return useMemo(
    () => ({
      status: state.status,
      foundIds: state.foundIds,
      count: state.foundIds.size,
      seconds: state.seconds,
      displaySeconds: calcDisplaySeconds(state),
      timerIdx: state.timerIdx,
      isCountdown: calcIsCountdown(state.timerIdx),
      perfect: state.status === 'finished' && state.foundIds.size >= TOTAL,
      input,
      badge,
      feedback,
      suggestion,
      newAchievements,
      handleChange,
      handleEnter,
      acceptSuggestion,
      setTimerIdx,
      giveUp,
      reset,
    }),
    [state, input, badge, feedback, suggestion, newAchievements, handleChange, handleEnter, acceptSuggestion, setTimerIdx, giveUp, reset],
  )
}
