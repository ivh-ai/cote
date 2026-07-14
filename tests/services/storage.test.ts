import { describe, it, expect, beforeEach } from 'vitest'
import {
  emptyStats,
  foldGame,
  loadStats,
  recordGame,
  resetStats,
  loadAchievements,
  saveAchievements,
  hasOnboarded,
  setOnboarded,
  loadLastName,
  saveLastName,
  type FinishedGame,
} from '../../src/services/storage'

// Minimal in-memory localStorage for the node test environment.
class MemStorage {
  private m = new Map<string, string>()
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
  clear() { this.m.clear() }
}

beforeEach(() => {
  ;(globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage()
})

const game = (over: Partial<FinishedGame> = {}): FinishedGame => ({
  mode: '30 min',
  count: 50,
  seconds: 300,
  perfect: false,
  perContinent: { europe: 20 },
  ...over,
})

describe('foldGame (pure)', () => {
  it('increments games played and records best', () => {
    const s = foldGame(emptyStats(), game({ count: 40, seconds: 100 }))
    expect(s.gamesPlayed).toBe(1)
    expect(s.bestCount).toBe(40)
    expect(s.bestCountSeconds).toBe(100)
  })
  it('keeps the higher best count across games', () => {
    let s = foldGame(emptyStats(), game({ count: 40 }))
    s = foldGame(s, game({ count: 30 }))
    expect(s.bestCount).toBe(40)
    s = foldGame(s, game({ count: 60 }))
    expect(s.bestCount).toBe(60)
  })
  it('tracks fastest perfect only from perfect games', () => {
    let s = foldGame(emptyStats(), game({ count: 197, seconds: 900, perfect: true }))
    expect(s.bestPerfectSeconds).toBe(900)
    s = foldGame(s, game({ count: 197, seconds: 800, perfect: true }))
    expect(s.bestPerfectSeconds).toBe(800)
    s = foldGame(s, game({ count: 50, seconds: 10, perfect: false }))
    expect(s.bestPerfectSeconds).toBe(800)
    expect(s.perfectGames).toBe(2)
  })
  it('keeps per-continent bests', () => {
    let s = foldGame(emptyStats(), game({ perContinent: { europe: 10, asia: 5 } }))
    s = foldGame(s, game({ perContinent: { europe: 8, asia: 12 } }))
    expect(s.perContinentBest.europe).toBe(10)
    expect(s.perContinentBest.asia).toBe(12)
  })
  it('caps history length', () => {
    let s = emptyStats()
    for (let i = 0; i < 60; i++) s = foldGame(s, game({ count: i }))
    expect(s.history.length).toBeLessThanOrEqual(50)
    expect(s.history[0].count).toBe(59) // newest first
  })
})

describe('storage round-trip', () => {
  it('records and loads stats', () => {
    recordGame(game({ count: 42 }))
    expect(loadStats().bestCount).toBe(42)
  })
  it('resets stats', () => {
    recordGame(game({ count: 42 }))
    resetStats()
    expect(loadStats().gamesPlayed).toBe(0)
  })
  it('persists achievements', () => {
    saveAchievements(new Set(['century', 'perfect']))
    const set = loadAchievements()
    expect(set.has('century')).toBe(true)
    expect(set.has('perfect')).toBe(true)
  })
  it('tracks onboarding flag', () => {
    expect(hasOnboarded()).toBe(false)
    setOnboarded()
    expect(hasOnboarded()).toBe(true)
  })
  it('remembers last name', () => {
    saveLastName('Maya')
    expect(loadLastName()).toBe('Maya')
  })
  it('returns defaults on corrupt data', () => {
    localStorage.setItem('cote_stats_v1', '{not json')
    expect(loadStats().gamesPlayed).toBe(0)
  })
})
