import { describe, it, expect } from 'vitest'
import { checkMilestone, isContinentComplete, continentProgress } from '../../src/game/milestones'
import { BY_CONTINENT } from '../../src/game/countries'
import { MILESTONES } from '../../src/game/constants'

describe('checkMilestone', () => {
  it('is true for each defined milestone', () => {
    for (const m of MILESTONES) expect(checkMilestone(m)).toBe(true)
  })
  it('is false for non-milestone counts', () => {
    expect(checkMilestone(1)).toBe(false)
    expect(checkMilestone(51)).toBe(false)
    expect(checkMilestone(197)).toBe(false)
  })
})

describe('isContinentComplete', () => {
  it('is false when empty', () => {
    expect(isContinentComplete('oceania', new Set())).toBe(false)
  })
  it('is true when all continent countries are found', () => {
    const oceania = BY_CONTINENT.oceania
    const found = new Set(oceania.map((c) => c.id))
    expect(isContinentComplete('oceania', found)).toBe(true)
  })
  it('is false when one is missing', () => {
    const oceania = BY_CONTINENT.oceania
    const found = new Set(oceania.slice(1).map((c) => c.id))
    expect(isContinentComplete('oceania', found)).toBe(false)
  })
})

describe('continentProgress', () => {
  it('counts found within a continent', () => {
    const europe = BY_CONTINENT.europe
    const found = new Set(europe.slice(0, 3).map((c) => c.id))
    const p = continentProgress('europe', found)
    expect(p.found).toBe(3)
    expect(p.total).toBe(europe.length)
  })
})
