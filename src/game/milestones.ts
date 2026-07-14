/** Milestones & continent completion — pure. See 05_GAME_ENGINE_SPECIFICATION.md §9, §13. */
import { MILESTONES } from './constants'
import { BY_CONTINENT, type ContinentKey } from './countries'

/** True if the found count is a celebrated milestone. */
export function checkMilestone(count: number): boolean {
  return MILESTONES.includes(count)
}

/** True if every country in the continent is present in the found set. */
export function isContinentComplete(key: ContinentKey, found: Set<string>): boolean {
  const list = BY_CONTINENT[key]
  return list.length > 0 && list.every((c) => found.has(c.id))
}

/** Count of found countries within a continent. */
export function continentProgress(key: ContinentKey, found: Set<string>): { found: number; total: number } {
  const list = BY_CONTINENT[key]
  return { found: list.filter((c) => found.has(c.id)).length, total: list.length }
}
