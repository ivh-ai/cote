import { describe, it, expect } from 'vitest'
import { sanitizeName, MAX_NAME_LEN } from '../../src/lib/sanitize'

describe('sanitizeName', () => {
  it('keeps normal names', () => {
    expect(sanitizeName('Maya')).toBe('Maya')
    expect(sanitizeName('Anna-Lee 99')).toBe('Anna-Lee 99')
  })
  it('strips angle brackets (XSS defence)', () => {
    expect(sanitizeName('<script>')).toBe('script')
    expect(sanitizeName('a<b>c')).toBe('abc')
  })
  it('collapses whitespace and trims', () => {
    expect(sanitizeName('  hello   world  ')).toBe('hello world')
  })
  it('clamps to max length', () => {
    const long = 'x'.repeat(50)
    expect(sanitizeName(long).length).toBe(MAX_NAME_LEN)
  })
  it('falls back to Anonymous when empty', () => {
    expect(sanitizeName('')).toBe('Anonymous')
    expect(sanitizeName('   ')).toBe('Anonymous')
    expect(sanitizeName('<>')).toBe('Anonymous')
  })
  it('does not strip digits or common punctuation', () => {
    expect(sanitizeName("O'Brien 3")).toBe("O'Brien 3")
  })
})
