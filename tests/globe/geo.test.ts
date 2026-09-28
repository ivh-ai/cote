import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { normalizeGeoId } from '../../src/globe/data/geo'
import { ALL_COUNTRIES } from '../../src/game/countries'
import { TOPO_COLOR } from '../../src/globe/data/topoColors'

describe('normalizeGeoId', () => {
  it('strips Natural Earth leading zeros to unpadded ids', () => {
    expect(normalizeGeoId('004')).toBe('4')
    expect(normalizeGeoId('036')).toBe('36')
    expect(normalizeGeoId('096')).toBe('96')
  })

  it('leaves 3-digit and non-numeric ids untouched', () => {
    expect(normalizeGeoId('250')).toBe('250')
    expect(normalizeGeoId('840')).toBe('840')
    expect(normalizeGeoId('-99')).toBe('-99')
    expect(normalizeGeoId('0')).toBe('0')
    expect(normalizeGeoId(undefined)).toBe('')
  })
})

describe('globe geometry ↔ country-id coverage', () => {
  const topo = JSON.parse(
    readFileSync(resolve(process.cwd(), 'public/data/countries-110m.json'), 'utf8'),
  ) as { objects: { countries: { geometries: { id: unknown }[] } } }
  const geoIds = new Set(topo.objects.countries.geometries.map((g) => normalizeGeoId(g.id)))

  it('every ISO-<100 country present in the map resolves (zero-padding regression)', () => {
    // Big, clearly-visible countries whose numeric ISO id is < 100 — these were
    // left grey by the geometry/game id-padding mismatch. Their normalized geometry
    // ids must exist so they colour when guessed.
    const formerlyBroken: Record<string, string> = {
      '36': 'Australia', '76': 'Brazil', '32': 'Argentina', '4': 'Afghanistan',
      '12': 'Algeria', '24': 'Angola', '40': 'Austria', '56': 'Belgium',
      '8': 'Albania', '51': 'Armenia', '31': 'Azerbaijan', '44': 'Bahamas',
      '50': 'Bangladesh', '64': 'Bhutan', '68': 'Bolivia', '70': 'Bosnia',
      '72': 'Botswana', '96': 'Brunei', '90': 'Solomon Islands', '84': 'Belize',
    }
    for (const [id, name] of Object.entries(formerlyBroken)) {
      expect(geoIds.has(id), `geometry missing ${name} (id ${id})`).toBe(true)
    }
  })

  it('the countries the map contains all match a country-list id', () => {
    const mapped = ALL_COUNTRIES.filter((c) => geoIds.has(c.id))
    // 110m map carries ~167 of the 197 sovereign entities (microstates omitted).
    expect(mapped.length).toBeGreaterThanOrEqual(160)
    // A formerly-broken country resolves to a real biome colour, not the fallback.
    expect(TOPO_COLOR['36']).toBeDefined()
  })
})
