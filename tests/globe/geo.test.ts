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

describe('globe geometry ↔ country-id coverage (50m)', () => {
  const topo = JSON.parse(
    readFileSync(resolve(process.cwd(), 'public/data/countries-50m.json'), 'utf8'),
  ) as { objects: { countries: { geometries: { id: unknown; properties?: { name?: string } }[] } } }
  const geoms = topo.objects.countries.geometries
  const geoIds = new Set(geoms.map((g) => normalizeGeoId(g.id)))
  // Kosovo ships id-less in Natural Earth; the loader rescues it by name → '383'.
  if (geoms.some((g) => g.properties?.name === 'Kosovo')) geoIds.add('383')

  it('ISO-<100 countries resolve (zero-padding regression)', () => {
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

  it('microstates now render in the 50m dataset', () => {
    const microstates: Record<string, string> = {
      '702': 'Singapore', '470': 'Malta', '492': 'Monaco', '336': 'Vatican City',
      '20': 'Andorra', '674': 'San Marino', '438': 'Liechtenstein', '462': 'Maldives',
      '48': 'Bahrain', '480': 'Mauritius', '132': 'Cape Verde', '383': 'Kosovo',
      '584': 'Marshall Islands', '583': 'Micronesia', '659': 'Saint Kitts and Nevis',
    }
    for (const [id, name] of Object.entries(microstates)) {
      expect(geoIds.has(id), `50m geometry missing ${name} (id ${id})`).toBe(true)
    }
  })

  it('nearly every sovereign country is now mappable', () => {
    const mapped = ALL_COUNTRIES.filter((c) => geoIds.has(c.id))
    // 50m carries 195 of the 197 (only Tuvalu — a tiny atoll — is absent).
    expect(mapped.length).toBeGreaterThanOrEqual(194)
    // A formerly-broken country still resolves to a real biome colour.
    expect(TOPO_COLOR['36']).toBeDefined()
  })
})
