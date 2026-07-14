/**
 * Country validation — pure, testable. See 05_GAME_ENGINE_SPECIFICATION.md §4–§7.
 * Tiers: exact (O(1)) → fuzzy (edit distance 1, on submit) → suggestion (similarity ≥ threshold).
 */
import { ALL_COUNTRIES, type Country } from './countries'
import { MIN_MATCH_LEN, SUGGEST_THRESHOLD } from './constants'

/**
 * Normalize input for matching. Folds diacritics (é→e, ô→o) via NFD decomposition,
 * lowercases, strips punctuation to spaces, and collapses whitespace.
 * The diacritic fold fixes the original gap (doc 05 §4.1) so "Côte d'Ivoire",
 * "São Tomé" resolve without relying solely on aliases.
 */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Levenshtein distance with fast-reject when length delta > 1 (used for 1-error fuzzy). */
export function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2 // fast-reject
  return fullEditDistance(a, b)
}

/** Full Levenshtein distance (no fast-reject) — used for suggestion similarity. */
export function fullEditDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export interface Lookup {
  /** normalized name/alias → country */
  map: Map<string, Country>
  /** all normalized keys (for fuzzy scan) */
  keys: string[]
}

/** Build the lookup table once. First-writer-wins on alias collisions (Blueprint §6.4). */
export function buildLookup(countries: Country[] = ALL_COUNTRIES): Lookup {
  const map = new Map<string, Country>()
  for (const c of countries) {
    const nameKey = normalize(c.name)
    if (!map.has(nameKey)) map.set(nameKey, c)
    for (const a of c.aliases) {
      const key = normalize(a)
      if (!map.has(key)) map.set(key, c)
    }
  }
  return { map, keys: [...map.keys()] }
}

const DEFAULT_LOOKUP = buildLookup()

/** Exact (or alias) match on the normalized input. O(1). */
export function exactMatch(input: string, lookup: Lookup = DEFAULT_LOOKUP): Country | null {
  return lookup.map.get(normalize(input)) ?? null
}

/**
 * Match tolerant of a single typo. Tries exact first, then a 1-edit scan.
 * Only meaningful on explicit submit (Enter); requires ≥ MIN_MATCH_LEN chars.
 */
export function fuzzyMatch(input: string, lookup: Lookup = DEFAULT_LOOKUP): Country | null {
  const norm = normalize(input)
  const exact = lookup.map.get(norm)
  if (exact) return exact
  if (norm.length < MIN_MATCH_LEN) return null
  for (const key of lookup.keys) {
    if (editDistance(norm, key) === 1) return lookup.map.get(key) ?? null
  }
  return null
}

/**
 * Closest unfound country as a "Did you mean?" suggestion.
 * Returns the best match with similarity ≥ threshold that is not already found
 * and is not itself an exact match of the input.
 */
export function suggestMatch(
  input: string,
  found: Set<string> = new Set(),
  countries: Country[] = ALL_COUNTRIES,
  lookup: Lookup = DEFAULT_LOOKUP,
): Country | null {
  const norm = normalize(input)
  if (norm.length < MIN_MATCH_LEN) return null
  const exact = lookup.map.get(norm)
  let best: Country | null = null
  let bestSim = 0
  for (const country of countries) {
    if (found.has(country.id)) continue
    if (exact && country.id === exact.id) continue
    const key = normalize(country.name)
    const maxLen = Math.max(norm.length, key.length)
    const sim = 1 - fullEditDistance(norm, key) / maxLen
    if (sim >= SUGGEST_THRESHOLD && sim > bestSim) {
      bestSim = sim
      best = country
    }
  }
  return best
}
