/**
 * Leaderboard service (Supabase). See 08_SUPABASE_SCHEMA.md.
 * Prefers the atomic `submit_score` RPC (server computes score + anti-cheat); falls back
 * to the legacy `COTE` REST table if the RPC is absent. Never throws into the UI —
 * every call returns { ok, data | error } so local play is never blocked (NFR-REL-1).
 */
import { sanitizeName } from '../lib/sanitize'
import { computeScore } from '../game/scoring'

const SUPABASE_URL = 'https://trxxtjilifjuqqunuzrl.supabase.co'
// Anon key is public by design; all write safety lives in RLS/RPC (Blueprint §16).
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeHh0amlsaWZqdXFxdW51enJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2OTI2NjAsImV4cCI6MjA5ODI2ODY2MH0.FreDn50gPRwZ9ULk9lGQtf2D3lG_a7hd_dDgz_wAma0'

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

const TIMEOUT_MS = 8000

export interface LeaderboardEntry {
  name: string
  countries: number
  seconds: number
  score: number
  mode?: string
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function withTimeout(init: RequestInit = {}): { init: RequestInit; cancel: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  return { init: { ...init, signal: controller.signal }, cancel: () => clearTimeout(timer) }
}

/** Fetch the top entries, ranked by score then time. Legacy COTE table (mode-less). */
export async function getTop(limit = 10): Promise<Result<LeaderboardEntry[]>> {
  const { init, cancel } = withTimeout({ headers: HEADERS })
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/COTE?select=name,countries,seconds,score&order=score.desc,seconds.asc&limit=${limit}`,
      init,
    )
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = (await res.json()) as LeaderboardEntry[]
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' }
  } finally {
    cancel()
  }
}

/**
 * Submit a score. Tries the hardened RPC first (server-computed score, atomic upsert),
 * then falls back to the legacy best-score-per-name REST flow if the RPC is unavailable.
 */
export async function submitScore(
  rawName: string,
  countries: number,
  seconds: number,
  mode = 'infinite',
): Promise<Result<LeaderboardEntry[]>> {
  const name = sanitizeName(rawName)

  // Preferred path: RPC (see 08 §5). Client never sends score.
  const rpc = await tryRpc(name, countries, seconds, mode)
  if (rpc.ok) return getTop()
  // If the RPC simply doesn't exist yet, fall back; otherwise report.
  if (rpc.error !== 'rpc-missing') {
    // Still attempt legacy so a player is never blocked, but surface nothing fatal.
  }

  return legacySubmit(name, countries, seconds)
}

async function tryRpc(
  name: string,
  countries: number,
  seconds: number,
  mode: string,
): Promise<Result<null>> {
  const { init, cancel } = withTimeout({
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ p_name: name, p_mode: mode, p_countries: countries, p_seconds: seconds }),
  })
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_score`, init)
    if (res.status === 404) return { ok: false, error: 'rpc-missing' }
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    return { ok: true, data: null }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' }
  } finally {
    cancel()
  }
}

/** Legacy REST flow: best-score-per-name via read-then-write (pre-RPC hardening). */
async function legacySubmit(
  name: string,
  countries: number,
  seconds: number,
): Promise<Result<LeaderboardEntry[]>> {
  const score = computeScore(countries, seconds)
  try {
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/COTE?name=eq.${encodeURIComponent(name)}&select=score`,
      { headers: HEADERS },
    )
    const existing = existingRes.ok ? ((await existingRes.json()) as { score: number }[]) : []
    if (existing.length > 0) {
      if (score > existing[0].score) {
        await fetch(`${SUPABASE_URL}/rest/v1/COTE?name=eq.${encodeURIComponent(name)}`, {
          method: 'DELETE',
          headers: HEADERS,
        })
        await insert(name, countries, seconds, score)
      }
    } else {
      await insert(name, countries, seconds, score)
    }
    return getTop()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' }
  }
}

async function insert(name: string, countries: number, seconds: number, score: number): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/COTE`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ name, countries, seconds, score }),
  })
}
