import { describe, it, expect } from 'vitest'
import {
  normalize,
  editDistance,
  fullEditDistance,
  buildLookup,
  exactMatch,
  fuzzyMatch,
  suggestMatch,
} from '../../src/game/matching'
import { ALL_COUNTRIES } from '../../src/game/countries'

describe('normalize', () => {
  it('lowercases and trims', () => {
    expect(normalize('  FRANCE  ')).toBe('france')
  })
  it('collapses whitespace', () => {
    expect(normalize('south   korea')).toBe('south korea')
  })
  it('strips punctuation to spaces', () => {
    expect(normalize("cote d'ivoire")).toBe('cote d ivoire')
  })
  it('folds diacritics', () => {
    expect(normalize('São Tomé')).toBe('sao tome')
    expect(normalize('Côte')).toBe('cote')
    expect(normalize('Türkiye')).toBe('turkiye')
  })
  it('handles empty and whitespace-only', () => {
    expect(normalize('')).toBe('')
    expect(normalize('   ')).toBe('')
  })
})

describe('editDistance', () => {
  it('is 0 for equal strings', () => {
    expect(editDistance('france', 'france')).toBe(0)
  })
  it('is 1 for a single typo', () => {
    expect(editDistance('kazakstan', 'kazakhstan')).toBe(1)
    expect(editDistance('brasi', 'brasil')).toBe(1)
  })
  it('fast-rejects when length delta > 1', () => {
    expect(editDistance('a', 'abcd')).toBe(2)
  })
  it('full distance computes larger values', () => {
    expect(fullEditDistance('kitten', 'sitting')).toBe(3)
  })
})

describe('exactMatch', () => {
  const lookup = buildLookup()
  it('matches every canonical name', () => {
    for (const c of ALL_COUNTRIES) {
      expect(exactMatch(c.name, lookup)?.id).toBe(c.id)
    }
  })
  it('matches every alias', () => {
    for (const c of ALL_COUNTRIES) {
      for (const a of c.aliases) {
        expect(exactMatch(a, lookup)?.id).toBe(c.id)
      }
    }
  })
  it('matches known aliases explicitly', () => {
    expect(exactMatch('USA', lookup)?.name).toBe('United States')
    expect(exactMatch('britain', lookup)?.name).toBe('United Kingdom')
    expect(exactMatch('burma', lookup)?.name).toBe('Myanmar')
    expect(exactMatch('holland', lookup)?.name).toBe('Netherlands')
  })
  it('resolves diacritic canonical names', () => {
    // "Sao Tome and Principe" canonical is ASCII already; ensure accented input for others works via aliases/fold
    expect(exactMatch('turkiye', lookup)?.name).toBe('Turkey')
  })
  it('returns null for unknown input', () => {
    expect(exactMatch('atlantis', lookup)).toBeNull()
    expect(exactMatch('', lookup)).toBeNull()
  })
})

describe('fuzzyMatch', () => {
  const lookup = buildLookup()
  it('accepts a single-character typo', () => {
    expect(fuzzyMatch('kazakstan', lookup)?.name).toBe('Kazakhstan')
    expect(fuzzyMatch('germny', lookup)?.name).toBe('Germany')
  })
  it('prefers exact over fuzzy', () => {
    expect(fuzzyMatch('france', lookup)?.name).toBe('France')
  })
  it('rejects two-error inputs', () => {
    expect(fuzzyMatch('kazkstan', lookup)).toBeNull()
  })
  it('rejects inputs shorter than the minimum length', () => {
    expect(fuzzyMatch('fr', lookup)).toBeNull()
  })
})

describe('suggestMatch', () => {
  it('suggests a close unfound country', () => {
    const s = suggestMatch('camboda')
    expect(s?.name).toBe('Cambodia')
  })
  it('excludes already-found countries', () => {
    const cambodia = ALL_COUNTRIES.find((c) => c.name === 'Cambodia')!
    const s = suggestMatch('camboda', new Set([cambodia.id]))
    expect(s?.id).not.toBe(cambodia.id)
  })
  it('returns null below the similarity threshold', () => {
    expect(suggestMatch('xyzzy')).toBeNull()
  })
  it('returns null for short input', () => {
    expect(suggestMatch('ca')).toBeNull()
  })
  it('does not suggest an exact match of the input', () => {
    // "france" is exact; suggestion should look past it (return null or a different country)
    const s = suggestMatch('france')
    expect(s?.name).not.toBe('France')
  })
})

describe('data integrity', () => {
  it('has 197 countries', () => {
    expect(ALL_COUNTRIES).toHaveLength(197)
  })
  it('has unique ids', () => {
    const ids = new Set(ALL_COUNTRIES.map((c) => c.id))
    expect(ids.size).toBe(197)
  })
  it('has no alias that collides with a different country name', () => {
    const lookup = buildLookup()
    for (const c of ALL_COUNTRIES) {
      expect(lookup.map.get(normalize(c.name))?.id).toBe(c.id)
    }
  })
})
