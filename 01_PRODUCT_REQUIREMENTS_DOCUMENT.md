# 01 — PRODUCT REQUIREMENTS DOCUMENT
## COTE: Countries of the Earth
### PRD v1.0

> Source of truth: [00_MASTER_BLUEPRINT.md](00_MASTER_BLUEPRINT.md). Where this document and the Blueprint conflict, the Blueprint wins and this document is corrected.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Design Philosophy](#3-design-philosophy)
4. [Target Audience](#4-target-audience)
5. [User Personas](#5-user-personas)
6. [Gameplay Loop](#6-gameplay-loop)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Complete Feature Inventory](#9-complete-feature-inventory)
10. [User Stories](#10-user-stories)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Success Metrics](#12-success-metrics)
13. [Risks](#13-risks)
14. [Future Roadmap](#14-future-roadmap)
15. [Open Questions & Recommendations](#15-open-questions--recommendations)

---

## 1. Executive Summary

COTE (Countries of the Earth) is a premium, desktop-first web application in which a player attempts to name all **197 sovereign countries** of the world from memory. Each correctly named country illuminates on a photorealistic, interactive 3D globe. The experience is designed to feel like a piece of Apple software — calm, cinematic, and precise — rather than a browser game.

The product is single-player, session-based, and free to play. It has no account requirement to play; an optional leaderboard lets players submit a score under a chosen name. The core loop is short (2–30 minutes) and infinitely replayable, and the primary emotional payoff is the satisfaction of watching the world fill in as knowledge is recalled.

**What ships in v1.0:**
- Two game modes: **Unlimited** (no timer) and **30-Minute Challenge**
- A photorealistic React Three Fiber globe with country reveal animations
- Robust country validation (aliases, historical names, fuzzy matching)
- Continent progress tracking and an achievement system
- A global leaderboard backed by Supabase
- Results, statistics, and shareable summaries
- Full keyboard operability and WCAG 2.1 AA compliance

**Explicitly out of scope for v1.0:** mobile/touch layouts, multiplayer, user accounts with persistent history, sound design, and alternate country sets (territories, capitals, flags).

---

## 2. Product Vision

**Vision statement:** *Make recalling the world feel like a privilege, not a quiz.*

COTE treats geography knowledge as something worth celebrating. The globe is the hero; the interface recedes. A player should be able to sit down, start typing, and within seconds be absorbed in the simple, escalating challenge of remembering one more country.

The long-term vision is for COTE to be the reference-quality example of what a "small" web game can be when every detail is crafted to an Apple standard — the kind of experience people send to friends with the message "you have to try this."

### 2.1 Product Pillars

1. **The globe is the product.** Every other element serves it.
2. **Immediate play.** No friction between intent and first correct answer.
3. **Honest challenge.** The game never cheats the player and never punishes them cruelly.
4. **Earned delight.** Celebration is proportional to achievement; a perfect game is a genuine event.
5. **Respect.** The product treats players as intelligent adults — no nagging, no dark patterns.

---

## 3. Design Philosophy

Inherited directly from Blueprint §4. Summarized here for product context:

- **Reduce until it breaks, then add back one thing.** Every screen is stripped to essentials.
- **Motion has meaning.** Animation communicates state, never decorates.
- **Silence is a feature.** Dark space and stillness are active tools; the globe on black is the signature image.
- **One material system.** Glassmorphism panels float above the globe; the globe is the only element with true physical depth.
- **Consistency is credibility.** Identical actions look and behave identically everywhere.

The aesthetic target is the intersection of **Apple** (restraint, precision, materials), **National Geographic** (realism, reverence for the planet), and **luxury travel** (warmth, earthy palette, a sense of aspiration). See [03_DESIGN_SYSTEM.md](03_DESIGN_SYSTEM.md).

---

## 4. Target Audience

**Primary:** Desktop users, ages 16–45, who enjoy trivia, geography, and "one more try" skill games. They are curious, mildly competitive, and appreciate craftsmanship. They discover the game via social sharing, word of mouth, and design/portfolio channels.

**Secondary:**
- Educators and students using it as a low-stakes geography drill.
- Design- and engineering-minded people who come for the craft (the globe, the motion) and stay for the game.
- Trivia and quiz-game enthusiasts migrating from text-only formats (e.g., Sporcle-style players) who want a premium visual upgrade.

**Platform assumption:** Desktop/laptop with a keyboard, modern GPU-capable browser (Chrome, Safari, Firefox, Edge — last two major versions). Mobile is a deliberate non-goal for v1.0 because the core input is fast typing and the globe is GPU-intensive; a compromised mobile port would violate the premium promise.

---

## 5. User Personas

### 5.1 "Maya" — The Competitive Completionist
28, product designer. Plays on her lunch break. Wants to beat her previous best and eventually get all 197. Cares about the leaderboard, her stats over time, and the satisfaction of a clean run. **Needs:** fast input, accurate validation, visible progress, a reason to come back. **Frustrations:** a valid answer being rejected; losing her place; a timer that feels arbitrary.

### 5.2 "David" — The Casual Explorer
41, high-school history teacher. Found COTE from a colleague. Plays Unlimited mode with no pressure, enjoys watching the map fill in, uses it to quiz himself. **Needs:** no timer pressure, forgiving matching, clear onboarding, dignity when he can't remember. **Frustrations:** being rushed; feeling stupid; confusing controls.

### 5.3 "Sana" — The Craft Admirer
34, front-end engineer. Came for the globe, arrived via a design newsletter. Will inspect the animations and share the link if it impresses her. **Needs:** flawless rendering, buttery motion, no jank, a screenshot-worthy moment. **Frustrations:** dropped frames, layout shift, anything that feels "webby" or cheap.

### 5.4 "Marcus" — The Accessibility-Reliant Player
52, uses keyboard navigation and a screen reader due to low vision. Wants to play the game fully without a mouse. **Needs:** complete keyboard operability, screen-reader announcements of progress, sufficient contrast, respect for reduced motion. **Frustrations:** mouse-only controls, unlabeled buttons, focus traps, color-only feedback.

Marcus is not an edge case. Per Blueprint §18, full keyboard operability and WCAG AA are **non-negotiable**.

---

## 6. Gameplay Loop

### 6.1 Core Loop (moment-to-moment)

```
        ┌──────────────────────────────────────────────┐
        │                                              │
        ▼                                              │
   Player recalls a country                            │
        │                                              │
        ▼                                              │
   Types name into always-focused input                │
        │                                              │
        ▼                                              │
   Game validates (exact → alias → fuzzy)              │
        │                                              │
   ┌────┴─────┐                                        │
   │          │                                        │
 Correct    Not yet / wrong                            │
   │          │                                        │
   ▼          ▼                                        │
 Country    Input feedback                             │
 reveals    (shake / suggestion)                       │
 on globe      │                                       │
   │           └───────────────────────────────────────┘
   ▼
 Count increments, continent progress updates,
 badge on milestone, input clears, globe may rotate to it
   │
   ▼
 (Loop continues until all found, time expires, or give up)
```

### 6.2 Session Loop (start to finish)

1. **Arrive** → Welcome screen (globe already alive in the background).
2. **Choose mode** → Unlimited or 30-Minute.
3. **(Optional) Onboarding** → three-beat interactive primer, skippable and remembered.
4. **Play** → the core loop above.
5. **End** → triggered by finding all 197, timer expiry, or "Give Up" (guarded).
6. **Reflect** → Results screen: count, time, missed countries revealed on the globe, per-continent breakdown, achievements earned.
7. **Act** → Share result, submit to leaderboard, view stats, or Play Again.
8. **Return** → Play Again resets cleanly to a fresh session in the same mode.

### 6.3 The Perfect Game

Naming all 197 is a distinct, rare terminal state with its own cinematic celebration (see [04_MOTION_SPECIFICATION.md](04_MOTION_SPECIFICATION.md)). It must feel earned and memorable — the single biggest delight moment in the product.

---

## 7. Functional Requirements

Requirements are identified `FR-<area>-<n>` for traceability.

### 7.1 Game Modes
- **FR-MODE-1:** The system shall offer exactly two modes in v1.0: Unlimited and 30-Minute Challenge.
- **FR-MODE-2:** Unlimited mode shall run a count-**up** timer with no end condition except completion or give-up.
- **FR-MODE-3:** 30-Minute mode shall run a count-**down** timer from 30:00; reaching 00:00 ends the game immediately and shows results.
- **FR-MODE-4:** Mode shall be selectable on the Welcome screen and locked for the duration of a session.

### 7.2 Input & Validation
- **FR-INPUT-1:** A single text input shall be auto-focused whenever the game is active and no modal is open.
- **FR-INPUT-2:** Input shall be normalized before matching: trimmed, lowercased, diacritics folded (é→e), punctuation and extra whitespace collapsed.
- **FR-VAL-1:** The system shall accept the canonical name of each of the 197 countries.
- **FR-VAL-2:** The system shall accept a curated set of **aliases** per country (e.g., "USA", "United States", "America"; "UK", "Britain", "Great Britain").
- **FR-VAL-3:** The system shall accept selected **historical / former names** where unambiguous (e.g., "Burma" → Myanmar, "Swaziland" → Eswatini, "Holland" → Netherlands).
- **FR-VAL-4:** The system shall apply **fuzzy matching** tolerant of a single typographical error (edit distance ≤ 1, length-aware) to auto-accept near-misses.
- **FR-VAL-5:** On an input that is close but below the auto-accept threshold, the system shall offer a **"Did you mean [country]?"** suggestion the player can accept.
- **FR-VAL-6:** Correct answers shall be **auto-accepted** on match without requiring the player to press Enter, *except* where fuzzy/suggestion confirmation is needed.
- **FR-VAL-7:** The system shall detect **duplicates** (already-found country) and give distinct, non-punishing feedback rather than counting or erroring.
- **FR-VAL-8:** Wrong guesses shall never end the game, deduct progress, or block input; they receive lightweight feedback only.

### 7.3 Globe & Reveal
- **FR-GLOBE-1:** The system shall render an interactive 3D globe that is visible on all game-related screens.
- **FR-GLOBE-2:** On a correct answer, the corresponding country shall animate to a "found" state (fill + highlight pulse).
- **FR-GLOBE-3:** The globe shall support user drag-to-rotate and zoom, with gentle auto-rotation when idle.
- **FR-GLOBE-4:** At game end, all **missed** countries shall be revealed in a visually distinct state.
- **FR-GLOBE-5:** Globe interaction shall never block or steal focus from the text input.

Full technical detail: [06_GLOBE_RENDERING_SPEC.md](06_GLOBE_RENDERING_SPEC.md).

### 7.4 Progress, Continents & Achievements
- **FR-PROG-1:** A persistent counter shall show `found / 197`.
- **FR-PROG-2:** A per-continent breakdown shall show progress for each of the 7 continents.
- **FR-PROG-3:** The system shall detect and celebrate **continent completion** (all countries in a continent found).
- **FR-ACH-1:** The system shall award achievements for defined milestones (e.g., counts of 50/100/150/197, each continent completed, speed thresholds). Full list in [05_GAME_ENGINE_SPECIFICATION.md](05_GAME_ENGINE_SPECIFICATION.md).
- **FR-ACH-2:** Achievement unlocks shall present a non-blocking badge animation that does not interrupt play.

### 7.5 Results, Stats & Sharing
- **FR-RESULT-1:** At game end the system shall show found count, elapsed/remaining time, continent breakdown, and achievements earned.
- **FR-RESULT-2:** The results view shall list missed countries and reflect them on the globe.
- **FR-STAT-1:** The system shall maintain local statistics across sessions (games played, best score, best time, per-continent bests) via local storage.
- **FR-SHARE-1:** The system shall generate a spoiler-free, copy-to-clipboard text summary of a result suitable for social sharing.

### 7.6 Leaderboard (Supabase)
- **FR-LB-1:** A player may submit a completed result to a global leaderboard under a chosen display name.
- **FR-LB-2:** The leaderboard shall be filterable by mode and rank by score, then by time.
- **FR-LB-3:** Submitted names shall be sanitized and validated; submission shall be rate-limited and server-validated against implausible scores (anti-cheat). See [08_SUPABASE_SCHEMA.md](08_SUPABASE_SCHEMA.md).
- **FR-LB-4:** The leaderboard shall be viewable without submitting or having an account.

### 7.7 Navigation & Screens
- **FR-NAV-1:** The app shall provide these screens: Welcome, Onboarding, Game, Results, Perfect, Leaderboard, Statistics, Achievements, About, plus error/empty states. See [02_INFORMATION_ARCHITECTURE.md](02_INFORMATION_ARCHITECTURE.md).
- **FR-NAV-2:** Navigation shall be fully keyboard-operable with predictable back/escape behavior.

### 7.8 Session Control
- **FR-SESS-1:** The player may end a game early via "Give Up," guarded by a single confirmation.
- **FR-SESS-2:** "Play Again" shall fully reset game state (found set, timer, globe, achievements-in-session) without a full page reload.
- **FR-SESS-3:** The player may pause 30-Minute mode? — **Recommendation (see §15):** no pause in v1.0; pausing undermines the challenge and complicates leaderboard integrity.

---

## 8. Non-Functional Requirements

Budgets and standards are owned by Blueprint §10–§11 and §16.

- **NFR-PERF-1:** Globe renders at ≥ 55 fps on target hardware; degrades gracefully to 30 fps rather than dropping frames erratically.
- **NFR-PERF-2:** First Contentful Paint < 1.5s; Time to Interactive < 3.0s; total gzipped JS < 400KB (Three.js in its own chunk).
- **NFR-PERF-3:** Input-to-feedback latency < 16ms (one frame); fuzzy match on submit < 50ms across 197 candidates.
- **NFR-PERF-4:** Cumulative Layout Shift < 0.1; timer uses tabular numerals to prevent shift.
- **NFR-A11Y-1:** WCAG 2.1 AA compliance, no exceptions; full keyboard operability; `prefers-reduced-motion` respected (including globe auto-rotation).
- **NFR-A11Y-2:** All feedback conveyed by more than color alone.
- **NFR-SEC-1:** Strict CSP; no inline scripts/eval; pinned CDN assets with integrity hashes; leaderboard input treated as untrusted.
- **NFR-REL-1:** The core game shall be fully playable even if the leaderboard/Supabase is unreachable (graceful degradation; local play never blocked by network).
- **NFR-MAINT-1:** Strict module boundaries (game / globe / ui); globe module has no direct React imports beyond its bridge; no magic numbers; ≥ 100% unit coverage of pure game logic.
- **NFR-COMPAT-1:** Latest two major versions of Chrome, Safari, Firefox, Edge on macOS and Windows.

---

## 9. Complete Feature Inventory

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| F1 | Unlimited mode (count-up) | P0 | Core |
| F2 | 30-Minute mode (count-down) | P0 | Core |
| F3 | Photorealistic 3D globe | P0 | Signature |
| F4 | Country reveal animation | P0 | Signature |
| F5 | Drag-rotate + zoom + auto-spin | P0 | |
| F6 | Auto-focused single input | P0 | |
| F7 | Normalization + exact match | P0 | |
| F8 | Alias matching | P0 | |
| F9 | Historical-name matching | P1 | |
| F10 | Fuzzy match (1-error) | P0 | |
| F11 | "Did you mean?" suggestion | P1 | |
| F12 | Duplicate detection | P0 | |
| F13 | Wrong-guess feedback (shake) | P0 | |
| F14 | Found counter (n/197) | P0 | |
| F15 | Per-continent progress | P0 | |
| F16 | Continent-completion celebration | P1 | |
| F17 | Achievement system | P1 | |
| F18 | Achievement unlock badges | P1 | |
| F19 | Results screen | P0 | |
| F20 | Missed-country reveal | P0 | |
| F21 | Local statistics | P1 | localStorage |
| F22 | Clipboard share summary | P1 | |
| F23 | Global leaderboard (view) | P1 | Supabase |
| F24 | Leaderboard submission + anti-cheat | P1 | Supabase |
| F25 | Welcome screen | P0 | |
| F26 | Interactive onboarding (skippable) | P1 | |
| F27 | Statistics screen | P2 | |
| F28 | Achievements screen | P2 | |
| F29 | About page | P2 | |
| F30 | Perfect-game celebration | P1 | Rare, cinematic |
| F31 | Give Up (guarded) | P0 | |
| F32 | Play Again (clean reset) | P0 | |
| F33 | Full keyboard navigation | P0 | Non-negotiable |
| F34 | Reduced-motion support | P0 | Non-negotiable |
| F35 | Error & empty states | P1 | |
| F36 | Intro cinematic (globe entrance) | P2 | Delight |

Priority: **P0** = required for a shippable v1.0; **P1** = target for v1.0; **P2** = nice-to-have, may slip to fast-follow.

---

## 10. User Stories

Written as user-facing behavior per Blueprint §12.5.

**Playing**
- US-1: As a player, I want the input focused the moment the game starts so I can begin typing without clicking.
- US-2: As a player, I want a correct country to be accepted the instant I finish typing it so my flow isn't interrupted by pressing Enter.
- US-3: As a player, I want a small typo ("Kazakstan") to still be accepted so I'm not penalized for spelling.
- US-4: As a player, I want to type "USA" or "Britain" and have it recognized so I don't have to guess the official name.
- US-5: As a player, when I re-type a country I already found, I want a gentle "already found" cue rather than an error.
- US-6: As a player, I want to watch each country light up on the globe so I feel my progress physically.
- US-7: As a player, I want to spin and zoom the globe to admire my progress without losing my typing focus.

**Progress & reward**
- US-8: As a player, I want to see how many of each continent I've found so I know where to focus.
- US-9: As a player, I want a moment of celebration when I complete a continent so the effort feels acknowledged.
- US-10: As a completionist, I want a distinct, memorable celebration when I get all 197 so the achievement feels real.

**Ending & sharing**
- US-11: As a player, I want to see which countries I missed at the end so I learn.
- US-12: As a player, I want to copy a shareable summary of my score so I can post it without spoiling the answers.
- US-13: As a competitive player, I want to submit my score to a leaderboard under a name so I can compare with others.
- US-14: As a player, I want to instantly start a fresh game so I can try to beat my score.

**Onboarding & help**
- US-15: As a first-time player, I want a brief, skippable primer so I understand the controls without reading a manual.
- US-16: As a returning player, I don't want to be shown onboarding again.

**Accessibility**
- US-17: As a keyboard-only player, I want to reach and operate every control without a mouse.
- US-18: As a screen-reader user, I want progress and results announced so I know my status.
- US-19: As a motion-sensitive player, I want animations (including globe auto-spin) reduced when I request it.

---

## 11. Acceptance Criteria

Representative Given/When/Then criteria; full set lives with each feature's implementation ticket.

**AC-INPUT (US-1, US-2)**
- Given the game screen is active and no modal is open, when the screen loads, then the text input is focused.
- Given the input has the exact normalized name of an unfound country, when the final matching character is typed, then the country is accepted without an Enter press, the input clears, and the count increments by 1.

**AC-FUZZY (US-3)**
- Given the input is within edit distance 1 of exactly one unfound country and unambiguous, when submitted, then it is auto-accepted.
- Given the input is close to a country but ambiguous or above distance 1, then a "Did you mean X?" suggestion appears and no count change occurs until accepted.

**AC-ALIAS (US-4)**
- Given the input matches a registered alias or approved historical name, when submitted, then the mapped country is accepted exactly as a canonical match.

**AC-DUPLICATE (US-5)**
- Given a country is already found, when its name is entered again, then a non-error "already found" cue is shown, the count is unchanged, and the input clears.

**AC-TIMER (FR-MODE-3)**
- Given 30-Minute mode with 00:01 remaining, when one second elapses, then the timer reads 00:00, input is disabled, and the Results screen is shown once.
- The 30-minute timer must not double-fire or double-register on React strict-mode remount (Blueprint §14.2 commit example).

**AC-MISSED (US-11)**
- Given the game ends with < 197 found, when Results is shown, then all unfound countries are listed and rendered in the missed state on the globe.

**AC-PERFECT (US-10)**
- Given the player finds the 197th country, then the Perfect celebration plays and the game enters the Perfect terminal state (distinct from ordinary Results).

**AC-LEADERBOARD (US-13, NFR-REL-1)**
- Given a completed game and a valid display name, when the player submits, then the score appears in the leaderboard for its mode.
- Given Supabase is unreachable, when the player finishes a game, then all local results/stats still function and the UI communicates that the leaderboard is temporarily unavailable without blocking Play Again.

**AC-A11Y (US-17, US-19)**
- Given keyboard-only input, then every action (start, type, accept suggestion, open/close modals, view leaderboard, play again) is reachable and operable, with visible focus states.
- Given `prefers-reduced-motion: reduce`, then all non-essential animation is suppressed and globe auto-rotation is disabled.

---

## 12. Success Metrics

**Engagement**
- Median session length ≥ 6 minutes.
- ≥ 40% of sessions result in a "Play Again" within the same visit.
- ≥ 25% of first-time visitors return within 7 days.

**Delight & sharing**
- ≥ 10% of completed games use the share function.
- Qualitative: unsolicited social shares that mention the globe/motion specifically.

**Quality (gates, not aspirations)**
- Lighthouse Performance ≥ 90; Accessibility = 100.
- Zero WCAG AA violations in audit.
- Globe sustains ≥ 55 fps on target hardware in QA.
- Crash-free session rate ≥ 99.5%.

**Correctness**
- < 0.1% of valid country submissions rejected in a rolling sample (validation quality).
- Zero confirmed leaderboard entries from implausible/cheated scores after anti-cheat.

---

## 13. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Globe performance on weak GPUs / integrated graphics | High | High | LOD strategy, fps-adaptive quality, reduced-motion fallback, degrade to 30fps (see [06](06_GLOBE_RENDERING_SPEC.md)) |
| Country-list political sensitivity (what counts as a "country") | Medium | High | Fix the canonical list to a defensible standard (197 = UN 193 members + Vatican, Palestine, Koswo/Taiwan decision documented); document rationale; treat as product decision, not code detail |
| Validation gaps (valid answers rejected) | Medium | High | Comprehensive alias/historical dataset, fuzzy layer, telemetry on rejected inputs, easy dataset updates |
| Leaderboard cheating / spam | High | Medium | RLS, server-side plausibility checks, rate limiting, name sanitization ([08](08_SUPABASE_SCHEMA.md)) |
| Scope creep beyond premium polish budget | Medium | Medium | P0/P1/P2 discipline; Blueprint §18 non-negotiables protected first |
| Mobile users arriving and bouncing | High | Low | Detect small/touch viewport, show a graceful "best on desktop" message rather than a broken port |
| Bundle bloat from Three.js + R3F + drei | Medium | Medium | Manual chunking, tree-shaking, code-splitting non-hero screens (Blueprint §11) |
| Accessibility of a 3D globe for screen readers | Medium | Medium | Globe as `role="img"` with live-region textual progress; game fully playable without seeing globe |

---

## 14. Future Roadmap

**v1.1 — Depth**
- Persistent accounts (optional) with cross-device stats history.
- Additional achievements and streaks.
- Sound design (opt-in): subtle ambient + reveal cues.

**v1.2 — Breadth of content**
- Alternate sets: capitals, flags, territories & dependencies.
- Regional/continent-only challenge modes.
- Difficulty settings (strict spelling mode for purists).

**v1.3 — Social**
- Head-to-head/async challenge a friend.
- Daily seed challenge with a shared leaderboard.

**v2.0 — Platform**
- Considered, well-crafted mobile/touch experience (not a port — a redesign).
- Localization of country names and UI.

Roadmap items are candidates, not commitments; each must pass the Blueprint §17 decision framework.

---

## 15. Open Questions & Recommendations

Per the brief's instruction to challenge weak ideas:

1. **Country list definition (must resolve before content work).** "197 countries" is a specific claim. Recommendation: adopt **UN 193 members + 2 UN observer states (Vatican, Palestine) + Taiwan + Kosovo? = document the exact 197.** This is a *product* decision with political sensitivity; it must be explicitly ratified by the PM and recorded, not silently encoded. **Flagging as the single most important pre-implementation decision.**

2. **Pause in 30-Minute mode.** Recommendation: **no pause.** Pausing weakens the challenge and creates leaderboard-integrity problems (stop-clock cheating). If accessibility review requires a pause accommodation, gate it so paused runs are ineligible for the leaderboard.

3. **Enter-to-submit vs. pure auto-accept.** Auto-accept (FR-VAL-6) is premium and fast, but pure auto-accept makes fuzzy/ambiguous cases awkward. Recommendation: **auto-accept exact/alias matches; require an explicit accept only for suggestions.** Keep Enter as an always-available manual submit for keyboard users and screen readers.

4. **Historical names scope.** Unbounded historical naming invites ambiguity (e.g., "Congo"). Recommendation: **curate a small, unambiguous historical set** and treat "Congo" as ambiguous → suggestion, not auto-accept.

5. **Leaderboard without accounts.** Anonymous submission is friction-free but spam-prone. Recommendation: **keep anonymous submission for v1.0** but pair it with strong server-side plausibility checks and rate limiting; defer accounts to v1.1.

6. **Statistics persistence.** localStorage-only stats are lost on browser clear and don't sync. Acceptable for v1.0; the roadmap's optional accounts (v1.1) address it. Recommendation: **design the stats data shape now so it can migrate to Supabase later without a breaking change.**

---

*This PRD is a living document owned by the Principal Product Manager. It is updated whenever a feature or requirement changes, and it defers to [00_MASTER_BLUEPRINT.md](00_MASTER_BLUEPRINT.md) on all standards.*

*Version 1.0.*
