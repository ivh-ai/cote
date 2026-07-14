import { describe, it, expect } from 'vitest'
import { evaluateAchievements, ACHIEVEMENTS, type AchievementContext } from '../../src/game/achievements'
import { ALL_COUNTRIES, BY_CONTINENT, TOTAL } from '../../src/game/countries'

const ctx = (over: Partial<AchievementContext>): AchievementContext => ({
  count: 0,
  seconds: 0,
  mode: '∞',
  found: new Set(),
  isCountdown: false,
  ...over,
})

describe('evaluateAchievements', () => {
  it('unlocks count milestones', () => {
    expect(evaluateAchievements(ctx({ count: 10 }))).toContain('first_ten')
    expect(evaluateAchievements(ctx({ count: 50 }))).toContain('half_century')
    expect(evaluateAchievements(ctx({ count: 100 }))).toContain('century')
    expect(evaluateAchievements(ctx({ count: 150 }))).toContain('sesqui')
  })

  it('unlocks perfect at TOTAL', () => {
    const found = new Set(ALL_COUNTRIES.map((c) => c.id))
    expect(evaluateAchievements(ctx({ count: TOTAL, found }))).toContain('perfect')
  })

  it('unlocks quickfire only within the time limit', () => {
    expect(evaluateAchievements(ctx({ count: 100, seconds: 599 }))).toContain('speed_100_10m')
    expect(evaluateAchievements(ctx({ count: 100, seconds: 601 }))).not.toContain('speed_100_10m')
  })

  it('unlocks flawless_30 only in 30-min mode at TOTAL', () => {
    const found = new Set(ALL_COUNTRIES.map((c) => c.id))
    expect(evaluateAchievements(ctx({ count: TOTAL, found, mode: '30 min' }))).toContain('flawless_30')
    expect(evaluateAchievements(ctx({ count: TOTAL, found, mode: '∞' }))).not.toContain('flawless_30')
  })

  it('unlocks continent completion', () => {
    const found = new Set(BY_CONTINENT.oceania.map((c) => c.id))
    const ids = evaluateAchievements(ctx({ count: found.size, found }))
    expect(ids).toContain('cont_oceania')
  })

  it('is idempotent against already-unlocked', () => {
    const first = evaluateAchievements(ctx({ count: 10 }))
    const again = evaluateAchievements(ctx({ count: 10 }), new Set(first))
    expect(again).not.toContain('first_ten')
  })

  it('every achievement has unique id, name, and hint', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id))
    expect(ids.size).toBe(ACHIEVEMENTS.length)
    for (const a of ACHIEVEMENTS) {
      expect(a.name.length).toBeGreaterThan(0)
      expect(a.hint.length).toBeGreaterThan(0)
    }
  })
})
