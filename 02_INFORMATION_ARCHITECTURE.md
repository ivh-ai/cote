# 02 — INFORMATION ARCHITECTURE
## COTE: Countries of the Earth
### IA & Interaction Specification v1.0

> Source of truth: [00_MASTER_BLUEPRINT.md](00_MASTER_BLUEPRINT.md) and [01_PRODUCT_REQUIREMENTS_DOCUMENT.md](01_PRODUCT_REQUIREMENTS_DOCUMENT.md).
> This document specifies *where things live* and *how the user moves between them*. Visual styling lives in [03_DESIGN_SYSTEM.md](03_DESIGN_SYSTEM.md); motion in [04_MOTION_SPECIFICATION.md](04_MOTION_SPECIFICATION.md).

---

## Table of Contents

1. [IA Principles](#1-ia-principles)
2. [Site Map](#2-site-map)
3. [Navigation Model](#3-navigation-model)
4. [Screen Inventory](#4-screen-inventory)
5. [User Flows](#5-user-flows)
6. [Welcome Experience](#6-welcome-experience)
7. [Interactive Onboarding](#7-interactive-onboarding)
8. [Game Flow](#8-game-flow)
9. [Leaderboard Flow](#9-leaderboard-flow)
10. [Achievement Flow](#10-achievement-flow)
11. [Statistics Flow](#11-statistics-flow)
12. [About Page](#12-about-page)
13. [Error States](#13-error-states)
14. [Empty States](#14-empty-states)
15. [Dialog Behavior](#15-dialog-behavior)
16. [Keyboard Navigation](#16-keyboard-navigation)
17. [Desktop-First Layout](#17-desktop-first-layout)
18. [Accessibility Journey](#18-accessibility-journey)

---

## 1. IA Principles

COTE is not a multi-page website; it is a **single continuous surface** — a desktop application feel — where the globe persists and content layers float above it. The IA therefore favors **overlays and in-place state transitions** over page navigation.

1. **The globe never unmounts.** Screens are layers over a persistent globe canvas. Navigation changes what floats above it, not the world beneath.
2. **One primary surface, modal secondaries.** The Game is the home surface. Leaderboard, Stats, Achievements, About, Instructions, and Onboarding are modal layers invoked from it and dismissed back to it.
3. **Depth, not pages.** Moving "into" a section pushes a layer forward (scale + blur backdrop); moving back pops it. This mirrors Apple's sheet/navigation-stack model rather than browser page loads.
4. **Escape always retreats one level.** There is a single, predictable dismissal gesture everywhere.
5. **No dead ends.** Every screen offers a clear route back to play.

Because this is desktop-first and app-like, routing is **state-driven** (a top-level view/overlay state), not URL-per-page. URLs may be added later for deep-linking (roadmap), designed so the state shape maps cleanly to routes.

---

## 2. Site Map

```
COTE (single application surface)
│
├── Welcome (entry overlay over live globe)
│     ├── → Start Game (mode + timer chosen here)
│     ├── → How to Play (Onboarding / Instructions)
│     ├── → Leaderboard
│     └── → About / Credits
│
├── Game (home surface — persistent globe + HUD)
│     ├── HUD: timer, found counter, input, continent panel
│     ├── ⓘ Instructions (modal)
│     ├── 🏆 Leaderboard (modal)
│     ├── 📊 Statistics (modal)
│     ├── ★ Achievements (modal)
│     ├── Give Up → confirm → Results
│     └── New Game → confirm-if-in-progress → Welcome/Game reset
│
├── Results (overlay; ordinary end state)
│     ├── Summary (count, time, continents, achievements)
│     ├── Missed countries (list + globe reveal)
│     ├── Share (clipboard)
│     ├── Submit to Leaderboard
│     └── Play Again
│
├── Perfect (overlay; 197/197 terminal celebration)
│     └── (superset of Results with cinematic celebration)
│
└── Modal layers (invokable from Game & Welcome)
      ├── Leaderboard
      ├── Statistics
      ├── Achievements
      ├── Instructions / How to Play
      └── About / Credits
```

Antarctica is intentionally excluded (matches the existing 6-continent model: N. America, S. America, Europe, Asia, Africa, Oceania).

---

## 3. Navigation Model

### 3.1 Layer Stack

The app maintains a conceptual stack:

```
[ Globe canvas ]                 ← always present, bottom
[ Active surface ]               ← Welcome | Game | Results | Perfect
[ Modal (0 or 1) ]               ← Leaderboard | Stats | Achievements | Instructions | About
[ Dialog (0 or 1) ]              ← confirmations (Give Up, New Game)
[ Transient (0 or 1) ]           ← achievement badge, feedback toast
```

Only **one modal** and **one dialog** may be open at a time. Opening a modal while another is open replaces it (no modal-on-modal stacking). A dialog may appear over a modal (e.g., confirm inside a flow) and always takes focus.

### 3.2 Navigation Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Open modal | Click HUD icon / keyboard | Modal scales in, globe backdrop blurs |
| Close modal | Escape / close button / backdrop click | Modal scales out, focus returns to trigger |
| Advance surface | Start / Give Up / find 197th | Surface crossfades; globe persists |
| Confirm dialog | Give Up, New-game-in-progress | Dialog over current layer; Enter confirms, Esc cancels |
| Retreat | Escape | Closes top-most layer only (dialog → modal → nothing) |

### 3.3 Persistence Rules

- The globe's rotation/zoom state persists across modal open/close.
- Game state (found set, timer) persists while modals are open; **the 30-minute timer keeps running** (no implicit pause — Blueprint/PRD §15 decision).
- Local statistics and last-used player name persist across sessions via localStorage.

---

## 4. Screen Inventory

| ID | Screen | Type | Purpose | Primary CTA |
|----|--------|------|---------|-------------|
| S1 | Welcome | Surface | Orient, choose mode, invite play | Start |
| S2 | Onboarding | Modal (multi-step) | Teach controls in ≤3 beats | Got it / Skip |
| S3 | Game | Surface (home) | The experience | (type) |
| S4 | Results | Surface/overlay | Reflect on the run | Play Again |
| S5 | Perfect | Surface/overlay | Celebrate 197/197 | Play Again / Share |
| S6 | Leaderboard | Modal | Compare scores | Submit / Close |
| S7 | Statistics | Modal | Personal history | Close |
| S8 | Achievements | Modal | Badges earned/locked | Close |
| S9 | Instructions | Modal | Reference for controls & rules | Close |
| S10 | About/Credits | Modal | Provenance, data sources, thanks | Close |
| E* | Error states | Inline/overlay | Communicate failure gracefully | Retry/Dismiss |
| Z* | Empty states | Inline | Guide when no data yet | Contextual |

### 4.1 Game HUD sub-components (all within S3)

- **Timer pill** — mode + live time (count-up or count-down), tabular numerals, warn/critical states.
- **Found counter** — `n / 197` with a thin progress indicator.
- **Input bar** — always-focused text field + inline "Did you mean?" suggestion affordance.
- **Continent panel** — six rows (N. America, S. America, Europe, Asia, Africa, Oceania), each showing found/total and expandable to reveal found country chips.
- **Utility cluster** — Instructions ⓘ, Leaderboard 🏆, Stats 📊, Achievements ★, New Game, Give Up.
- **Found/milestone badge** — transient, top-center (country name, milestone, or "continent complete").
- **Feedback toast** — transient ("Already found", "Invalid entry").

---

## 5. User Flows

### 5.1 First-time player (happy path)

```
Land → Welcome (globe alive)
     → choose mode (default: 30 min) 
     → Start
     → Onboarding (3 beats)  ── Skip? ──┐
     → Got it                           │
     → Game (input focused) ◄───────────┘
     → type countries → reveals accumulate
     → (end condition) → Results
     → Share / Submit / Play Again
```

### 5.2 Returning player (onboarding suppressed)

```
Land → Welcome → Start → Game (no onboarding; `cote_onboarded` flag set)
```

### 5.3 Give-up flow

```
Game → Give Up → Dialog "End game? Found n."
     → Confirm → Results
     → Cancel  → back to Game (input refocused)
```

### 5.4 New-game-mid-play flow

```
Game (in progress) → New Game → Dialog "End current game? Found n."
     → Confirm → reset → Welcome (or straight to fresh Game per setting)
     → Cancel  → back to Game
```

### 5.5 Timer-expiry flow (30-min)

```
Game → timer hits 00:00 → auto → Results (input disabled, single transition)
```

### 5.6 Perfect flow

```
Game → find 197th → Perfect celebration → Perfect surface → Share/Submit/Play Again
```

---

## 6. Welcome Experience

**Goal:** In one glance, communicate what COTE is, set a premium tone, and remove all friction to starting.

- The globe is **already live and rotating** behind a darkened, blurred veil — the product sells itself before a word is read.
- Centered, minimal stack: wordmark (COTE), one-line descriptor ("Name every country on Earth."), mode/timer selector, a single primary **Start**, and quiet secondary links (How to Play · Leaderboard · About).
- Default mode selection: **30 min** (matches existing default `timerIdx = 3` → ∞; **recommendation:** change default to a bounded, sharable challenge — see §Open Questions in PRD). Selector offers 10 / 20 / 30 / ∞.
- No autoplay audio, no popovers, no cookie nag beyond what's legally required.
- **Start** transitions directly into Onboarding (first visit) or Game (returning).

**Entrance choreography:** globe eases in from slightly zoomed-out + fades; wordmark and controls stagger up. Full timing in [04](04_MOTION_SPECIFICATION.md).

---

## 7. Interactive Onboarding

**Goal:** Teach three things, fast, and never again.

Three beats, each a single sentence with a live demonstration on the globe:

1. **Type a country.** (Field pulses; a sample country reveals on the globe.)
2. **We're forgiving.** (Show "USA", "Britain", a typo being accepted.)
3. **Find them all before time runs out.** (Show the counter and timer.)

Rules:
- **Skippable at all times** (persistent Skip). "Got it" on the last beat.
- On completion or skip, set `cote_onboarded = true` in localStorage; never auto-shown again.
- Reachable anytime via Instructions (S9) for reference.
- Fully keyboard-operable: Enter/→ advances, Esc skips.
- Respects reduced motion (demonstrations become static state changes).

---

## 8. Game Flow

The Game is the home surface. Detailed rules are in [05_GAME_ENGINE_SPECIFICATION.md](05_GAME_ENGINE_SPECIFICATION.md); here we define *interaction structure*.

**Layout regions (desktop):**
- **Center/background:** the globe (hero), interactive (drag-rotate, double-click zoom, auto-spin when idle).
- **Top:** timer pill (left of center) and found counter (right of center), or a unified top bar.
- **Bottom-center:** the input bar (thumb of the experience — always focused).
- **Right rail (or bottom sheet):** continent panel with expandable rows.
- **Corner cluster:** utility icons (Instructions, Leaderboard, Stats, Achievements, New Game, Give Up).

**Interaction guarantees:**
- Input is refocused after any modal/dialog closes and after each accepted guess.
- Globe interaction never steals focus from the input (FR-GLOBE-5).
- Correct answer: reveal animation + counter increment + continent-panel update + transient badge (country / milestone / continent-complete) + input clears.
- Wrong/invalid on Enter: input shakes, "Invalid entry" toast; no state change.
- Near-miss: inline "Did you mean X?" — Enter or click accepts.
- Duplicate: "Already found" toast; no count change; input clears.

**Milestones surfaced during play:** counts at 25/50/100/150/175 (from existing engine) and each continent completion produce the celebratory badge.

---

## 9. Leaderboard Flow

```
Open (Welcome or Game) → Leaderboard modal
   ├── Loading state (skeleton rows)
   ├── Populated: top entries, ranked by score (countries×1000 − seconds), then time
   ├── Filter by mode (recommended addition; current backend stores one score)
   ├── Empty state (no entries yet)
   └── Error state (Supabase unreachable) → "Leaderboard unavailable" + Retry
Submit (from Results/Perfect) → name entry → validate/sanitize → POST → re-fetch → highlight own row
```

Rules:
- Viewable **without** submitting or an account (FR-LB-4).
- Submission only offered from an ended game (Results/Perfect) with a valid, sanitized display name.
- Better-score-replaces-worse for the same name (matches existing `addLeaderboardEntry` behavior); documented as intended in [05](05_GAME_ENGINE_SPECIFICATION.md)/[08](08_SUPABASE_SCHEMA.md).
- Network failure never blocks Play Again (NFR-REL-1).

---

## 10. Achievement Flow

- **During play:** unlocking an achievement fires a **non-blocking** badge (top-center, auto-dismiss), distinct from the found/milestone badge in styling. It never interrupts input.
- **Achievements modal (S8):** grid of all achievements; earned ones shown in full color with earned-date, locked ones shown dimmed with a hint (progressive disclosure — don't spoil).
- **From Results:** achievements earned *this run* are listed and lightly emphasized.
- Achievement definitions and unlock logic live in [05_GAME_ENGINE_SPECIFICATION.md](05_GAME_ENGINE_SPECIFICATION.md).

---

## 11. Statistics Flow

- **Statistics modal (S7):** personal, local history (localStorage): games played, best count, best time (per mode), per-continent best, average, last played.
- **Empty state:** before any completed game — "Play your first game to start tracking your stats," with a Start/Play button.
- Data shape designed to migrate to Supabase accounts later (PRD §15.6) without breaking changes.
- Read-only; a quiet "Reset statistics" action guarded by a confirmation dialog.

---

## 12. About Page

- **About/Credits modal (S10):** what COTE is, the country-list standard used (the existing 197-entity list, with a note on inclusion choices — e.g., Taiwan, Kosovo, Palestine, Vatican included; Antarctica excluded), data sources (Natural Earth / world-atlas TopoJSON), technology credits, and acknowledgments.
- Links open in a new tab with `rel="noopener noreferrer"`.
- This is where the politically sensitive inclusion rationale is transparently documented for players.

---

## 13. Error States

| Context | Failure | UX |
|---------|---------|-----|
| Map data load | TopoJSON/world-atlas fetch fails | Globe area shows a calm "Couldn't load the map" with Retry; rest of UI still responsive; game start deferred until loaded |
| Leaderboard load | Supabase GET fails | Modal shows "Leaderboard unavailable right now" + Retry; game unaffected |
| Leaderboard submit | POST fails | Non-blocking toast "Couldn't submit — your game is saved locally"; offer Retry; never lose the result |
| Fonts/assets | Google Fonts fails | `font-display: swap` fallback to system; no blocking |
| Unknown/runtime | Uncaught error | App-level error boundary → dignified full-screen "Something went wrong" + Reload; never a white screen |

All errors: human language, no codes in the primary message, a clear next action, and no dead ends. Errors are announced to assistive tech (`role="alert"`/`aria-live`).

---

## 14. Empty States

| Screen | Empty condition | Content |
|--------|-----------------|---------|
| Leaderboard | No entries | "Be the first to make the board." + how scoring works |
| Statistics | No completed games | "Play your first game to start tracking your stats." + Play |
| Achievements | None earned | All locked with hints; encouraging header, not a blank grid |
| Continent panel | 0 found in a continent | Row shows `0 / n`, collapsed, muted — not hidden (consistency) |
| Missed list (Results) | Perfect game | Replaced by the Perfect celebration; no "missed" list shown |

Empty states are designed, never blank: each has a message, a reason, and (where possible) an action.

---

## 15. Dialog Behavior

Confirmation dialogs are reserved for **destructive or session-ending** actions only (Blueprint §4.IV — trust the user; no confirmations for reversible actions).

Dialogs in v1.0:
- **Give Up** → "End game? You've found n countries." (Confirm / Cancel)
- **New Game while in progress** → "End current game? You've found n." (Confirm / Cancel)
- **Reset statistics** → "Clear all your statistics? This can't be undone." (Confirm / Cancel)

Behavior:
- Modal, focus-trapped, backdrop dims + blurs.
- Default focus on the **safe** option (Cancel).
- Enter confirms, **Escape cancels**, backdrop click cancels.
- Destructive confirm button uses the danger color and is visually separated from Cancel (Blueprint design laws).
- No `window.confirm` in production (the existing code's `window.confirm` in `reset()` is replaced by a styled dialog — logged as a migration item for [05](05_GAME_ENGINE_SPECIFICATION.md)/implementation).

---

## 16. Keyboard Navigation

Full operability without a mouse is **non-negotiable** (Blueprint §18.1).

| Action | Keys |
|--------|------|
| Type / guess | Focused input (auto-focused) |
| Submit guess (manual) | Enter |
| Accept "Did you mean?" | Enter (when suggestion shown) or Tab→Enter on the suggestion button |
| Open Instructions / LB / Stats / Achievements | Tab to icon → Enter/Space |
| Close top layer | Escape |
| Confirm dialog | Enter (confirm) / Escape (cancel) |
| Onboarding advance / skip | Enter or → / Escape |
| Continent row expand | Tab to row → Enter |
| Start / Play Again / New Game | Tab → Enter |
| Rotate globe (a11y) | Arrow keys when globe control is focused (recommended addition; mouse-drag is not keyboard-reachable in current code) |

Rules:
- Tab order follows visual reading order (top→bottom, left→right).
- Focus is trapped inside open modals/dialogs and restored to the trigger on close.
- Visible focus rings everywhere (`:focus-visible`, 2px, never removed without replacement).
- The always-focused input must not create a focus trap that prevents Tabbing to controls — Tab moves to the utility cluster and back.

---

## 17. Desktop-First Layout

- **Primary target:** ≥ 1024px wide, keyboard present. Optimal 1280–1440.
- **Grid:** centered max-width content columns per Blueprint §7/§4.2; globe fills the backdrop.
- **Breakpoints considered (graceful, not first-class in v1.0):**
  - `< 768px` (phones): show a courteous "COTE is designed for desktop" gate with a live mini-globe, rather than a broken port (PRD risk mitigation). Do not disable zoom; keep the message accessible.
  - `768–1023px` (tablets/small laptops): functional but de-emphasized; continent panel may collapse to a bottom sheet.
  - `≥ 1024px`: full experience.
- No horizontal scroll at any supported width; `min-h-dvh` over `100vh`.
- Fixed HUD elements reserve safe padding so the globe is never fully occluded.

---

## 18. Accessibility Journey

Tracing "Marcus" (PRD persona 5.4) end-to-end:

1. **Arrive:** Page has a proper `<title>`, one `<h1>`, and a skip-to-input link. The globe is `role="img"` with a descriptive `aria-label`; it is not required to play.
2. **Welcome:** Mode selector is a labeled radio group; Start is a real button. Reduced motion disables globe auto-spin and entrance animation.
3. **Onboarding:** Each beat is announced; advancing/skip is keyboard-driven; content is text-first (not reliant on the globe demo).
4. **Play:** Input has a visible, associated label. Progress (`n/197`) and continent updates announce via `aria-live="polite"`, throttled (timer announces at most every ~10s, not every second — Blueprint §10.4).
5. **Feedback:** Correct/duplicate/invalid conveyed by text + icon, never color alone; input shake paired with a text message.
6. **Milestones/achievements:** Announced politely without stealing focus.
7. **End:** Results are a landmarked region; missed countries are a real list; the summary is readable and announced.
8. **Leaderboard/Stats/Achievements:** Tables/lists with proper semantics; own entry identified by text, not just highlight color.
9. **Throughout:** Contrast meets AA (note: the existing palette's `textDim #333` on `#080808` and `textMuted #888` must be audited — flagged for [03](03_DESIGN_SYSTEM.md) to define AA-passing tokens).

Accessibility acceptance is owned by the Accessibility Specialist and gates release (Blueprint §17.3).

---

*This IA is owned by the UX Researcher with the HI Designer. It defers to the Blueprint on standards and to the PRD on scope. Version 1.0.*
