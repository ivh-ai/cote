/** Input sanitization — see 07_TECHNICAL_ARCHITECTURE.md §8, 08_SUPABASE_SCHEMA.md §5. */

/** Max length for a leaderboard display name. */
export const MAX_NAME_LEN = 24

// Control chars (U+0000–U+001F, U+007F) plus angle brackets — defence-in-depth.
// Built via string escapes so the source contains no literal control characters.
// oxlint-disable-next-line no-control-regex -- stripping control chars is the intent
const UNSAFE = new RegExp('[\\u0000-\\u001f\\u007f<>]', 'g')

/**
 * Sanitize a player-provided display name: strip control chars and angle brackets,
 * collapse whitespace, clamp length. Falls back to 'Anonymous' when empty.
 * Treated as untrusted input (Blueprint §16.1); render-escaping is handled by React.
 */
export function sanitizeName(raw: string): string {
  const cleaned = raw
    .replace(UNSAFE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LEN)
  return cleaned.length > 0 ? cleaned : 'Anonymous'
}
