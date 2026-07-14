import { describe, it, expect } from 'vitest'
import { computeScore, formatTime } from '../../src/game/scoring'

describe('computeScore', () => {
  it('rewards more countries above less time', () => {
    expect(computeScore(100, 10)).toBeGreaterThan(computeScore(99, 0))
  })
  it('breaks ties by lower time', () => {
    expect(computeScore(50, 10)).toBeGreaterThan(computeScore(50, 20))
  })
  it('computes the documented formula', () => {
    expect(computeScore(197, 100)).toBe(197 * 1000 - 100)
  })
})

describe('formatTime', () => {
  it('formats boundaries', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(59)).toBe('00:59')
    expect(formatTime(60)).toBe('01:00')
    expect(formatTime(1800)).toBe('30:00')
    expect(formatTime(5999)).toBe('99:59')
  })
  it('clamps negatives to zero', () => {
    expect(formatTime(-5)).toBe('00:00')
  })
  it('floors fractional seconds', () => {
    expect(formatTime(65.9)).toBe('01:05')
  })
})
