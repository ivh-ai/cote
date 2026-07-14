# 05 — GAME ENGINE SPECIFICATION
## COTE: Countries of the Earth
### Gameplay Engine v1.0

> Source of truth: [00_MASTER_BLUEPRINT.md](00_MASTER_BLUEPRINT.md), [01_PRODUCT_REQUIREMENTS_DOCUMENT.md](01_PRODUCT_REQUIREMENTS_DOCUMENT.md).
> This is the production engineering spec for game logic. It documents the **existing** behavior in `src/WorldCountriesGame.jsx` and the **target** refactor into a pure, testable `game/` module (Blueprint §6.2). Where the two differ, both are stated.
>
> **Design constraint:** all logic here is pure JavaScript — no React, no DOM, no Three.js — so it can be unit-tested at 100% coverage (Blueprint §12.2).

---

## 1. Overview & Module Shape

Target `src/game/` modules (Blueprint §7.1):

| Module | Exports |
|--------|---------|
| `constants.js` | `TOTAL`, `TIMER_MODES`, `CONTINENTS`, `CONTINENT_OF`, `MILESTONES` |
| `countries.js` | `ALL_COUNTRIES`, `BY_CONTINENT` |
| `matching.js` | `normalize`, `editDistance`, `fullEditDistance`, `buildLookup`, `exactMatch`, `fuzzyMatch`, `suggestMatch` |
| `milestones.js` | `checkMilestone`, `isContinentComplete` |
| `achievements.js` | `ACHIEVEMENTS`, `evaluateAchievements` |
| `scoring.js` | `computeScore`, `formatTime` |
| `useGameState.js` | the single React hook wiring the pure logic to UI |

The current single-file implementation inlines all of this; the refactor extracts it behind these boundaries without behavior change unless noted.

---

## 2. State Machine

### 2.1 States

| State | Meaning | Entry | Exit |
|-------|---------|-------|------|
| `idle` | Loaded, not yet playing; timer at 0/full | App start, after reset | First keystroke |
| `playing` | Active game; timer running | First non-empty input | Give up / timer 0 / 197 found |
| `finished` | Game over; results/missed shown | giveUp, timer expiry, completion | reset() |

Plus overlay/UI sub-states orthogonal to the game FSM: `showWelcome`, `showInstructions`, `showLeaderboard`, `showCredits` (existing). The **target** IA (doc 02) reorganizes these into a single modal layer; the FSM core (idle→playing→finished) is unchanged.

### 2.2 Transition diagram

```
                 first keystroke
     idle ───────────────────────────► playing
      ▲                                   │
      │                                   │ giveUp()  |  timer→0 (countdown)  |  found == TOTAL
      │ reset()                           ▼
      └──────────────────────────────  finished
```

Terminal refinement: `finished` with `count == TOTAL` is the **Perfect** presentation (IA S5); `finished` with `count < TOTAL` is ordinary **Results** (IA S4). This is a *view* distinction, not a separate FSM state (`perfect = finished && count >= TOTAL`).

### 2.3 Invariants
- No transition out of `finished` except `reset()`.
- Input is disabled in `finished`.
- Guessing is a no-op in `idle` until it flips to `playing` (the flip happens on first non-empty input — existing `handleChange`).
- The found set only grows during `playing`; `reset()` empties it.

---

## 3. Timer Logic

### 3.1 Modes

Existing `TIMER_MODES`:

| Label | Total (s) | Kind |
|-------|-----------|------|
| 10 min | 600 | countdown |
| 20 min | 1200 | countdown |
| 30 min | 1800 | countdown |
| ∞ | `null` | count-up (Unlimited) |

The PRD headlines **Unlimited** and **30-Minute** as the marquee modes; the engine retains all four timer options. Mode is chosen while `idle` and **locked** once `playing` (existing: pill `onClick` guarded by `gameState === "idle"`).

### 3.2 Tick model
- A 1-second interval runs only while `playing` (existing `useEffect`).
- Internal counter `seconds` always counts **up** from 0.
- Displayed time: count-up → `seconds`; countdown → `max(0, total - seconds)`.
- Countdown end: when `seconds >= total`, transition to `finished` (existing).

### 3.3 Warning states
- `timeWarning` when countdown and remaining ≤ 60s (opacity pulse, 1s).
- `timeCritical` when remaining ≤ 10s (faster pulse + terracotta).
- Reduced-motion: color-only, no pulse (doc 04).

### 3.4 Known defect to fix in refactor
The interval effect depends on `[gameState, isCountdown, timerMode]`; under React 18 Strict Mode double-invocation and object-identity churn of `timerMode`, the interval can be re-registered. **Requirement:** the refactor must guarantee exactly one active interval (single effect keyed on primitive `gameState` + `timerIdx`, cleanup verified) — this is the `AC-TIMER` "must not double-fire" criterion (PRD §11) and the Blueprint §14.2 commit example.

---

## 4. Country Validation

### 4.1 Normalization
`normalize(s)` (existing, endorsed):
```
lowercase → trim → replace [^a-z0-9 ] with space → collapse whitespace → trim
```
This folds punctuation and case. **Gap:** it does not fold diacritics (é→e) beyond stripping them to spaces — e.g., "Côte d'Ivoire" → "c te d ivoire". Aliases compensate (`cote divoire`, `cote d ivoire`). **Recommendation:** add Unicode NFD diacritic folding before stripping so accented input matches canonical spellings robustly; keep alias set as backup. (Tracked for implementation.)

### 4.2 Lookup table
`buildLookup(ALL_COUNTRIES)` produces `LOOKUP` mapping every normalized canonical name **and** every normalized alias → country. First-writer-wins on alias collisions (existing `if (!LOOKUP[key])`). Built once at module load (Blueprint §6.4 parse-once).

### 4.3 Match tiers (in order)
1. **Exact:** `LOOKUP[normalize(input)]` — O(1). Used on every keystroke.
2. **Fuzzy (1 error):** only on explicit submit (Enter). `editDistance(norm, key) === 1` scan over all keys, min length 3, with fast-reject when length delta > 1 (existing `fuzzyLookup`).
3. **Suggestion:** if neither, `suggestMatch(input)` finds the closest unfound country with similarity ≥ 0.75 (`1 - fullEditDistance/maxLen`) for a "Did you mean?" affordance.

### 4.4 Auto-acceptance (FR-VAL-6)
- On **change** (typing): exact match only → auto-accept, clear input. This avoids premature triggers mid-word (existing `tryGuess(val)` without `showErrors`).
- On **Enter**: exact OR fuzzy → accept; else if input non-empty → "Invalid entry" feedback (existing `tryGuess(val, true)`).
- Suggestions are accepted by clicking the chip or (target) pressing Enter when a suggestion is shown.

---

## 5. Alias Matching

Aliases are authored per country in `ALL_COUNTRIES[].aliases` and folded into `LOOKUP`. The existing set is comprehensive and endorsed. Categories:

- **Abbreviations/codes:** USA, US, UK, GB, UAE, DRC, CAR, PNG, NZ, FSM, KSA, RSA, ROK, DPRK, ROC, PRC, BIH.
- **Common short forms:** America, Britain, England, Emirates, Salvador, Congo (→ Republic of the Congo).
- **Endonyms:** Deutschland, España, Nippon/Nihon, Suomi, Hellas, Bharat/Hindustan, Zhongguo, Aotearoa, Polska, Norge, Sverige, Italia, Brasil.
- **Local/alt spellings:** Türkiye, Czechia, Cabo Verde.

Rule: aliases resolve to their country **exactly as** a canonical match (AC-ALIAS). Duplicate-alias conflicts resolve by first-writer-wins and are audited during content review.

---

## 6. Historical Country Names

Curated, unambiguous historical/former names are treated as aliases (PRD §15.4 — keep the set small and unambiguous). Existing set (endorsed):

| Historical → | Current |
|--------------|---------|
| Burma | Myanmar |
| Swaziland | Eswatini |
| Zaire | DR Congo |
| Ceylon | Sri Lanka |
| Persia | Iran |
| Siam | Thailand |
| Abyssinia | Ethiopia |
| Nyasaland | Malawi |
| Kampuchea | Cambodia |
| East Timor | Timor-Leste |
| Byelorussia/Belorussia | Belarus |
| Formosa | Taiwan |
| FYROM / Macedonia | North Macedonia |
| Western Samoa | Samoa |
| Holland | Netherlands |
| Rumania | Romania |

**Ambiguity guard:** "Congo" maps to Republic of the Congo (existing); DR Congo requires "DRC"/"Democratic Republic…"/"Zaire"/"Congo Kinshasa". "Korea" maps to South Korea. These are deliberate disambiguation choices, documented in About (IA §12) and here so they are not "bugs."

---

## 7. Input Processing (pipeline)

```
keystroke → handleChange(value)
   ├─ if idle && value non-empty → state = playing
   ├─ tryGuess(value, showErrors=false)   // exact only
   │     ├─ hit & new     → accept (see §9), clear input, clear suggestion
   │     ├─ hit & dup     → "Already found" feedback, (target) clear input
   │     └─ miss          → keep input; suggestion = suggestMatch(value) if len≥3
   └─ render

Enter → handleKeyDown
   └─ tryGuess(input, showErrors=true)     // exact + fuzzy
         ├─ hit → accept, clear input
         └─ miss & non-empty → "Invalid entry" (shake), clear input
```

Debounce: suggestion computation runs on change; it is cheap (≤197 comparisons) but the target adds a 150ms debounce (Blueprint §6.4) to avoid churn on fast typing.

---

## 8. Duplicate Detection

- `guessedRef` (a `Set` of country ids) is the authoritative found set, mirrored into React state (`guessedIds`) for rendering. The ref exists so the animation loop and rapid successive guesses read the current value without stale-closure bugs (Blueprint §13.2 example).
- On a match already in the set: show a neutral **"Already found!"** cue, **no** count change, **no** error styling (FR-VAL-7, AC-DUPLICATE).
- **Target fix:** the existing change-handler leaves the duplicate text in the input; spec requires clearing the input on a recognized duplicate for flow consistency.

---

## 9. Accept Flow (on a valid, new guess)

Sequence (existing `tryGuess` success branch, formalized):

1. Add `country.id` to a new `Set` (immutable update), assign to `guessedRef` and `setGuessedIds`.
2. Set `activeTab` to the country's continent (existing auto-switch; target must not steal keyboard focus — doc 02 §12).
3. Determine badge:
   - If the country's continent is now complete (and continent size > 1) → **"{Continent} complete!"** (3.5s).
   - Else if `count` ∈ MILESTONES `[25,50,100,150,175]` → **"{count} / 197 found!"** (2.5s).
   - Else → **country name** (2.5s).
4. Trigger the globe reveal (doc 04 §3.7) via the globe API.
5. Evaluate achievements (§11) and enqueue any unlock toasts.
6. If `count >= TOTAL` → state = `finished` (Perfect).
7. Clear feedback; clear input; clear suggestion.

All timeouts are named constants (Blueprint §5.2) — no magic numbers in the refactor (`BADGE_MS = 2500`, `CONTINENT_BADGE_MS = 3500`).

---

## 10. Wrong Guess Handling

- Wrong guesses **never** end the game, deduct, or block input (FR-VAL-8).
- On Enter with an unrecognized, non-empty input: `cote-shake` on the field + "Invalid entry" text (color + text + motion; never color alone), auto-clears after 2s (existing `showFeedback`).
- On typing a non-matching partial: no error — just possibly a suggestion.
- Reduced-motion: shake → border flash + text (doc 04 §3.12).

---

## 11. Statistics Tracking

**In-session (existing):** `count`, `seconds`, per-continent found/total, completion %.

**Cross-session (target, PRD F21):** persisted to `localStorage` under a versioned key `cote_stats_v1`:
```
{
  gamesPlayed, perfectGames,
  best: { count, timeForBestCount },
  bestTimePerfect,               // fastest 197
  perContinentBest: { africa: n, ... },
  lastPlayedISO,
  history: [ { mode, count, seconds, dateISO } ]  // capped length
}
```
Shape chosen to migrate to Supabase accounts later without a breaking change (PRD §15.6). Stats update on entering `finished`. "Reset statistics" clears the key (dialog-guarded, IA §15).

---

## 12. Achievement System

**Target (PRD F17/F18; not in existing code — new).** Pure `evaluateAchievements(state)` returns newly-unlocked ids given `{ count, seconds, mode, perContinent, perfect }` and the already-unlocked set (persisted in `localStorage: cote_achievements_v1`).

Proposed v1.0 achievement set:

| id | Name | Condition |
|----|------|-----------|
| `first_ten` | Getting Started | 10 found in a game |
| `half_century` | Half Century | 50 found |
| `century` | Centurion | 100 found |
| `sesqui` | 150 Club | 150 found |
| `perfect` | Cartographer | 197 found (Perfect) |
| `cont_africa` … `cont_oceania` | {Continent} Complete | all countries in a continent found (×6) |
| `speed_100_10m` | Quickfire | 100 found within 10 minutes |
| `flawless_30` | Beat the Clock | Perfect in 30-min mode with time to spare |
| `no_fuzzy` (optional) | Spelling Bee | Perfect with zero fuzzy-accepted answers |

Rules:
- Evaluation is pure and idempotent; unlock toast fires once (dedupe against persisted set).
- Continent-complete achievements align with the existing continent-completion celebration (§9.3) but are tracked separately (badge = in-play celebration; achievement = persistent unlock).
- Unlock presentation is non-blocking (doc 04 §3.13).

---

## 13. Continent Completion

- Six continents (no Antarctica): N. America, S. America, Europe, Asia, Africa, Oceania.
- `BY_CONTINENT[key]` derived once from `CONTINENT_OF`, sorted alphabetically (existing).
- `isContinentComplete(key, foundSet)` = every country in that continent is found.
- On completion: celebratory badge (§9.3), continent tab shows accent state, and the `cont_*` achievement unlocks (§12).

---

## 14. Leaderboard Submission

**Existing behavior (Supabase REST, table `COTE`):**
- Score: `computeScore(countries, seconds) = countries * 1000 - seconds`. Higher is better; more countries dominates, ties broken by lower time.
- Submit: check for existing row with the same `name`; if present and new score is higher → delete old, insert new; if absent → insert. (Best-score-per-name.)
- Load: top 10 ordered by `score desc`.

**Target hardening (see [08_SUPABASE_SCHEMA.md](08_SUPABASE_SCHEMA.md)):**
- Move the read-modify-write into a server-side RPC / upsert to avoid the race between the client GET and POST.
- Sanitize/validate `name` (length ≤ 24 already via `maxLength`; strip control chars; profanity/HTML escape on render — treat as untrusted, Blueprint §16.1).
- Anti-cheat: server-side plausibility (e.g., reject `countries > 197`, `seconds < floorForCount`, impossible score), rate-limit submissions (RLS + policy).
- Failure never blocks the player (NFR-REL-1); submission is best-effort with retry.

**Note:** the existing anon key is embedded in client source. Anon keys are public by design, but all write safety must therefore live in RLS/policies, not the client (doc 08).

---

## 15. Clipboard Sharing

Existing share string:
```
COTE 🌍 {count}/{TOTAL} countries in {mm:ss} ({mode} mode)
Play at: cote.netlify.app
```
- Copied via `navigator.clipboard.writeText`; button shows "Copied ✓" for 2.5s.
- **Spoiler-free** (no country names) — good (PRD FR-SHARE-1).
- **Fixes for target:** the URL should match the actual deploy target (Vite `base:'/cote/'` → GitHub Pages, not netlify) — reconcile the canonical play URL in [07](07_TECHNICAL_ARCHITECTURE.md)/[DEPLOYMENT]. Provide a clipboard fallback for browsers without the Clipboard API (execCommand or a select-and-copy affordance). Announce success via `aria-live`.

---

## 16. Replay Logic

`reset(force)` (existing):
- If not forced and `playing` with ≥1 found → confirm ("End current game? Found n."). **Target:** replace `window.confirm` with the styled dialog (IA §15).
- Clears `guessedRef`, `guessedIds`, `input`, `seconds`; state → `idle`; clears badges and overlays.
- Play Again from Results/Perfect calls `reset(true)` (no confirm — the game is already over).
- Globe does **not** replay its intro on reset; found-fills clear back to land-gray (doc 04 §3.5).

---

## 17. Game Over Flow

Triggers → `finished`:
1. **Give Up** (guarded confirm) — reveals missed countries.
2. **Timer expiry** (countdown reaches 0) — single transition, input disabled (AC-TIMER).
3. **Completion** (197 found) — Perfect.

On `finished`:
- Globe recolors: found → biome color, missed → dark red fill + red stroke (existing map-update effect).
- Results overlay (or Perfect overlay) presents summary, per-continent breakdown with expandable found/missed chip lists, share, and leaderboard submission (existing).
- Stats/achievements are committed once on entry to `finished` (target).

---

## 18. Edge Cases

| # | Case | Required behavior |
|---|------|-------------------|
| 1 | Map data fails to load | Game start deferred; calm retry (IA §13); no crash |
| 2 | Enter on empty input | No-op, no error text |
| 3 | Whitespace-only input | Normalized to empty → no-op |
| 4 | Duplicate via alias | "Already found" (id-based dedupe catches all aliases) |
| 5 | Fuzzy match to an already-found country | Treated as duplicate, not a new find |
| 6 | Ambiguous fuzzy (input within 1 of two countries) | First match wins (existing); target: prefer exact-length / lexical, or fall to suggestion — documented as acceptable |
| 7 | Very fast typing auto-accepting mid-word | Prevented: change-handler uses exact-only (no fuzzy on change) |
| 8 | Timer expiry exactly as a guess lands | State machine: whichever sets `finished` first wins; guess counts if it set the set before the tick; no double results overlay |
| 9 | Strict-mode double effect | Exactly one timer, one CSS injection, one map load (cleanup verified) |
| 10 | Reset mid-countdown | Interval cleared; seconds→0; no ghost ticks |
| 11 | Leaderboard offline | View shows unavailable; submit queues/retries; play unaffected |
| 12 | Name with emoji/HTML/control chars | Sanitized before store/render (§14) |
| 13 | Same name, worse score | Not written (best-score-per-name) |
| 14 | Completion in Unlimited (no time-to-spare) | Perfect shows "Completed in mm:ss" (existing) |
| 15 | Reduced motion during Perfect | Static hero frame (doc 04 §3.17) |
| 16 | Country with continent size 1 | No "continent complete" badge (guard `contCountries.length > 1`) — verify no such continent exists (all ≥12) |
| 17 | Diacritic input ("Côte d'Ivoire", "São Tomé") | Must resolve (add NFD folding + aliases) — §4.1 gap |

---

## 19. Testing Requirements (traceability)

Per Blueprint §12.2, 100% unit coverage of `game/`:
- `normalize`: case, whitespace, punctuation, diacritics (after fix), unicode.
- `exactMatch`: all 197 names + every alias.
- `fuzzyMatch`: valid 1-error accepts; 2-error rejects; length-<3 rejects; length-delta>1 fast-reject.
- `suggestMatch`: ≥0.75 threshold, excludes found, returns best, no false-positive on exact.
- `computeScore`/`formatTime`: boundaries (0, 59, 60, 1800, count 0/197).
- `isContinentComplete`, `checkMilestone`, `evaluateAchievements`: each milestone/continent, idempotency.
- State machine: every transition + invariants (no exit from finished except reset; single timer).

---

*Owned by the Staff + Senior Engineers. Pure logic, fully tested, no magic numbers. Version 1.0.*
