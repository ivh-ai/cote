# COTE — Countries of the Earth
## Product Specification Document

---

## 1. Overview

**COTE (Countries of the Earth)** is a single-page browser game where players try to name all 197 countries in the world. As each country is correctly typed, it lights up on a spinning 3D globe. The game is built as a React + Vite single-page application with no backend required (leaderboard functionality excluded from this spec).

**Core loop:** Type a country name → it auto-accepts if correct → the country lights up on the globe → repeat until time runs out or all 197 are found.

---

## 2. Tech Stack

- **Framework:** React 18 + Vite
- **Globe rendering:** D3.js with `geoOrthographic` projection, TopoJSON world data
- **Map data:** `world-atlas@2` countries-110m.json (loaded from CDN at runtime)
- **TopoJSON parser:** topojson-client v3 (loaded from CDN at runtime)
- **Font:** Poppins (Google Fonts) — weights 300, 400, 500, 600, 700, 800, 900
- **Styling:** All inline React styles + a single injected `<style>` tag for CSS classes and keyframe animations
- **No CSS files, no Tailwind, no component libraries**

---

## 3. Design System

### 3.1 Color Tokens

```
bg:          #080808   — page background
surface:     #080808   — header, input bar, panel (same as bg, seamless)
surfaceAlt:  #0e0e0e   — card interiors, stat boxes, accordion rows
border:      rgba(255,255,255,0.06)
borderBold:  rgba(255,255,255,0.10)
white:       #ffffff
text:        #ffffff   — primary text
textMuted:   #888888   — secondary/label text
textDim:     #333333   — placeholder chips (unguessed country slots)
accent:      #ffffff
gold:        #f59e0b   — leaderboard medals
landDark:    #4a5568   — unguessed country fill on globe
foundBg:     #0a1f14   — guessed country chip background
foundBorder: #16a34a   — guessed country chip border
foundText:   #86efac   — guessed country chip text
missBg:      #1a0a0a   — missed country chip background
missBorder:  #dc2626   — missed country chip border
missText:    #fca5a5   — missed country chip text
timeWarn:    #ef4444   — timer color when warning
```

### 3.2 Typography

- **Font family:** `'Poppins', system-ui, sans-serif`
- **Logo/title:** 900 weight, uppercase, wide letter-spacing
- **Headings:** 700–800 weight
- **Body/labels:** 400–500 weight
- **Timer digits:** monospace font, 700 weight
- **Micro labels:** 10px uppercase with 0.08–0.12em letter-spacing

### 3.3 Spacing & Shape

- Border radius on cards/modals: 14px
- Border radius on buttons: 7–8px
- Border radius on chips/pills: 4px
- Border radius on badges: 999px (pill)
- All UI sections (header, map, input bar, panel) share the same background color — no visible separation between zones

---

## 4. Layout Structure

The app is a full-viewport flex column (`height: 100vh`, `overflow: hidden`) with four fixed zones stacked vertically:

```
┌──────────────────────────────────────┐
│  HEADER (58px)                       │
├──────────────────────────────────────┤
│  PROGRESS BAR (3px)                  │
├──────────────────────────────────────┤
│  GLOBE AREA (flex: 1, fills space)   │
├──────────────────────────────────────┤
│  INPUT BAR (~70px)                   │
├──────────────────────────────────────┤
│  CONTINENT PANEL (~175px)            │
│    Tabs row (~44px)                  │
│    Country chips (124px scroll)      │
└──────────────────────────────────────┘
```

Overlays (Welcome, Instructions, Results, Credits) render as `position: absolute, inset: 0` over the entire viewport at `z-index: 100`. The Leaderboard overlay renders at `z-index: 110`.

---

## 5. Globe

### 5.1 Rendering

- Uses D3.js `geoOrthographic` projection
- SVG fills 100% of the globe area div
- Globe is centered in the SVG with a base radius calculated as `min(width, height) * 0.42`
- Rendered layers (bottom to top):
  1. Background rect (full SVG, `#0c0c0c`)
  2. Atmosphere circle (radius = BASE_R + 10) — subtle white fade at edge, no blue tint
  3. Ocean circle — radial gradient from `#2a6898` (center-left highlight) to `#0e3860` (mid) to `#040d20` (edge)
  4. Country paths — filled per-country (see 5.2)
  5. Terminator shadow overlay — dark radial gradient from lower-right to simulate day/night
  6. Specular highlight — white radial gradient from upper-left, very low opacity, simulates light reflection
  7. Edge rim darkening — darkens the globe perimeter for depth

### 5.2 Country Fill Colors

Each country has a hardcoded topographical fill color in a `TOPO_COLOR` lookup (keyed by TopoJSON numeric ID):

- **Greens** (`#5a7a4a`, `#6b8a5e`, `#4a6a3a`, etc.) — forested/temperate countries
- **Oranges/tans** (`#c4956a`, `#b8864e`, `#d4a574`, etc.) — desert/arid countries
- **Greys** (`#8a9aa8`, `#7a8a96`, `#6a7a88`, etc.) — mountainous countries
- **Fallback:** `#6b8a5e` for any country not in the lookup

State-based fills:
- **Unguessed:** `C.landDark` (`#4a5568`)
- **Guessed:** `TOPO_COLOR[id]` or `#6b8a5e`
- **Missed (game over):** `#4a1010` fill, `#7f1d1d` stroke
- Stroke on all paths: `#4a5a4a`, width `0.8`

### 5.3 Globe Interaction

**Drag to rotate:**
- Mouse down on SVG begins drag
- `mousemove` updates `rotate` state via D3's `geoOrthographic.rotate()`
- Rotation is applied as `[lon - dx * sensitivity, lat + dy * sensitivity]`
- Animation loop uses `requestAnimationFrame` for smooth rendering

**Auto-spin:**
- When not being dragged, the globe auto-rotates slowly on the Y axis
- Spin stops during active drag, resumes on mouse up

**Double-click to zoom:**
- First double-click: zooms in (scale increases to `BASE_R * 1.6`)
- Second double-click: zooms back out to BASE_R
- Zoom animates smoothly over ~400ms

**Map update:**
- Country fills update via D3 `.attr("fill", ...)` on the `.countries` group whenever `guessedIds` changes

---

## 6. Game Mechanics

### 6.1 Country Data

- 197 countries total
- Each country: `{ id: string, name: string, aliases: string[] }`
- ID matches the TopoJSON numeric country ID (as a string, leading zeros stripped)
- Aliases cover alternate spellings, e.g. "USA" → "United States", "Czech Republic" → "Czechia"

### 6.2 Input Matching

**On every keystroke (real-time, no Enter needed):**
- Normalize input: lowercase, trim, collapse whitespace, remove diacritics
- Check `LOOKUP[normalized]` for an exact match
- If found → auto-accept immediately, clear input

**On Enter keypress:**
- Run `fuzzyLookup(input)`:
  1. Check exact match first
  2. If no exact match, scan all country keys and accept if `editDistance(input, key) === 1` (one character off)
- If found → accept
- If not found → show "Invalid entry" feedback, shake input, clear input

**Edit distance (fuzzy):**
- Fast single-pass Levenshtein check that returns early once distance exceeds 1
- Only fires on Enter, minimum 3 characters in input

**"Did you mean?" suggestions:**
- After every keystroke (if no match found), run a slower full Levenshtein scan
- Find the closest unguessed country with similarity ≥ 75%
- Display as a clickable button: "Did you mean [Country]?"
- Clicking it accepts that country and clears input

**Duplicate detection:**
- If a correctly-spelled country was already guessed, show "Already found!" in grey
- Does not clear or shake the input

### 6.3 Accepting a Country

When a country is accepted:
1. Add its ID to `guessedIds` (a `Set`)
2. Switch the active continent tab to that country's continent
3. Trigger the last-found badge:
   - Normal find: "✓ [Country Name]" — green pill, 2.5s timeout
   - Continent complete (all countries in that continent found): "🎉 [Continent] complete!" — white pill, 3.5s timeout
   - Milestone (25, 50, 100, 150, 175 found): "🎉 [N] / 197 found!" — white pill, 2.5s timeout
4. Clear feedback and suggestion states
5. Check if all 197 found → set game state to "finished" (triggers perfect state)

### 6.4 Game States

- **`idle`:** Game not started. Timer not running. Input enabled. Typing first character starts the game.
- **`playing`:** Timer running. Input active.
- **`finished`:** Timer expired or Give Up clicked or all 197 found. Input disabled.

### 6.5 Give Up

- "Give Up" button only shown during `playing` state
- Sets game state to `finished`
- Globe fills missed countries red; Results popup opens

### 6.6 New Game

- "New Game" button always visible in header
- During `playing` state with at least 1 country found: shows browser confirm dialog ("End current game? You've found N countries so far.")
- Resets all state: guessedIds, timer, input, feedback, overlays

---

## 7. Timer System

### 7.1 Timer Modes

Four modes selectable before game starts (locked once playing):

| Label | Duration |
|-------|----------|
| 10 min | 600s countdown |
| 20 min | 1200s countdown |
| 30 min | 1800s countdown |
| ∞ | Stopwatch (counts up, no limit) |

### 7.2 Display

- Shows "TIME" label (8px, uppercase) above the digits
- Label changes to "LEFT" in countdown mode, "TIME" in stopwatch mode
- Format: `MM:SS` (monospace font)
- Ticks every second via `setInterval`

### 7.3 Warning States

- **Last 60 seconds:** Timer digits turn red (`#ef4444`), slow pulse animation (1s cycle)
- **Last 10 seconds:** Faster pulse (0.4s cycle), stays red
- Countdown expiry: game state → `finished`

---

## 8. Progress Bar

- 3px tall bar directly below the header
- Background: `rgba(255,255,255,0.05)`
- Fill: gradient `#555555 → #ffffff`, width = `(found / 197) * 100%`
- Animates width with `transition: width 0.5s cubic-bezier(0.16,1,0.3,1)`
- On perfect completion (all 197): gradient changes to `#e2e8f0 → #ffffff`

---

## 9. Input Bar

Located directly above the continent panel. Contains:

1. **Text input** — full width, placeholder "Type a country name…" (or "Game over — start a new game!" when finished)
   - `autoFocus` on mount
   - On bad guess: shakes horizontally (`cote-shake` animation, 0.35s) + red border flash
   - On focus: white border glow (`rgba(255,255,255,0.4)`) + subtle box shadow
   - During `playing`: border is `rgba(255,255,255,0.2)` to indicate active
   - During `finished`: disabled

2. **Right side hint** — shown when no feedback is active:
   - `idle` state: "Start typing to begin" (muted grey)
   - `finished` state: "[N] / 197 found" (red text)

3. **Feedback row** (below input, min-height 22px):
   - Good feedback: green (`#4ade80`) — e.g. for future use
   - Bad feedback: red (`#f87171`) — "Invalid entry"
   - Neutral feedback: grey (`#94a3b8`) — "Already found!"
   - "Did you mean" suggestion: grey label + clickable indigo-dim button with country name

---

## 10. Last-Found Badge

- Appears at `top: 16px`, horizontally centered over the globe
- Pill shape, `backdropFilter: blur(8px)`
- Entrance animation: slides down + fades in (`cote-badge-in`, 0.2s)
- Auto-dismisses after 2.5s (3.5s for milestone/continent badges)

**Normal find:**
- Background: `rgba(10,31,20,0.95)`, border: `rgba(34,197,94,0.5)`, text: `#86efac`
- Content: `✓ [Country Name]`

**Milestone / continent complete:**
- Background: `rgba(20,20,20,0.97)`, border: `rgba(255,255,255,0.4)`, text: `#ffffff`
- Content: `🎉 [Message]`
- Slightly larger padding and font

---

## 11. Continent Panel

### 11.1 Tabs

Six continent tabs in a single row:

| Key | Label | Count |
|-----|-------|-------|
| north_america | N. America | 23 |
| south_america | S. America | 12 |
| europe | Europe | 49 |
| asia | Asia | 45 |
| africa | Africa | 54 |
| oceania | Oceania | 14 |

Each tab shows the continent abbreviation and `found/total` below it. Active tab has a white bottom border (2px). When a continent is fully completed, the count turns white/accent.

Switching tabs is instant — no animation.

### 11.2 Country Chips

A `124px` tall scrollable area below the tabs. Chips are displayed in alphabetical order per continent, wrapping left to right.

**Chip states:**
- **Unguessed:** `·  ·  ·` placeholder text, dark background (`#0e0e0e`), dim border
- **Guessed:** Country name, green background/border/text
- **Missed (game over only):** Country name, red background/border/text

All chips have `transition: background 0.25s, color 0.25s, border-color 0.25s` for smooth reveal.

---

## 12. Overlays & Modals

All modals share:
- Overlay backdrop: `rgba(0,0,0,0.92)`, `backdropFilter: blur(10px)`
- Card: background `#080808`, border `rgba(255,255,255,0.10)`, border-radius 14px, `box-shadow: 0 32px 96px rgba(0,0,0,0.8)`
- Entrance animation: `cote-modal-in` (scale 0.96→1 + translateY 8→0, 0.22s cubic-bezier)
- Escape key closes: Leaderboard, Credits, Instructions (when not in initial flow)

### 12.1 Welcome Screen

Shown on first load. Full-screen overlay.

Content (centered):
- Globe icon in a circle (white stroke SVG)
- "COTE" — 900 weight, 30px, uppercase, wide spacing
- "Countries of the Earth" — muted, 13px
- Horizontal rule divider
- "Welcome." — 500 weight, 16px
- "Can you name every country in the world? / 197 countries. One globe. Let's find out." — muted, 13px
- "NEXT →" button — full width, white background, black text, 800 weight, uppercase

Clicking NEXT closes Welcome and opens Instructions.

### 12.2 Instructions Screen

Shown after Welcome, or triggered by the ⓘ button in the header.

Content:
- "HOW TO PLAY" heading + "Six things to know" subtitle
- Divider
- Six bullet points, each with an accent dot, bold title, and description:
  1. **Name all 197 countries** — type in the box, auto-accepts, no Enter needed
  2. **Spin the globe** — drag to rotate, double-click to zoom
  3. **Countries light up** — topographical colors revealed on correct guess
  4. **Choose your timer** — 10/20/30 min or ∞
  5. **Track by continent** — panel at the bottom, alphabetical order
  6. **Give up** — reveals missed countries at any time
- "PLAY" button — full width, white background, black text

Clicking PLAY closes Instructions and focuses the input.

### 12.3 Results Screen

Shown when game ends without a perfect score (`finished` state, count < 197).

Content:
- "Session Results" heading + "Good try!" subtitle
- Three stat boxes in a grid:
  - **Time Played** — `MM:SS` in monospace
  - **Countries** — `N / 197`
  - **Completion** — `N%`
- "Breakdown by Region" accordion — one row per continent:
  - Shows continent name, `found/total`, mini progress bar, chevron
  - Expanded: shows green "Correct (N)" chip list + red "Missed (N)" chip list
- Name input — "Enter your name for the leaderboard…" (can be left blank)
- Two buttons side by side:
  - **Share** (ghost) — copies result text to clipboard in Wordle format: "COTE 🌍 N/197 in MM:SS (mode)\nPlay at: [url]". Label swaps to "Copied ✓" for 2.5s
  - **Submit Score →** (primary) — saves score and opens Credits

### 12.4 Perfect State

Shown when all 197 countries are found. Replaces the globe area (overlay over it).

Content (centered, no card):
- 🌍 emoji (56px)
- "All 197 countries!" — 28px, 900 weight
- Completion time or time remaining
- "Play Again" button

### 12.5 Credits Screen

Shown after submitting score.

Content:
- Globe icon in circle
- "COTE" title
- "Thank you for playing!"
- About box (dark surface):
  - Paragraph about the game being built by Ishaan Hattangady using Claude Code without writing a single line of code by hand
  - Paragraph noting inspiration from Globle and World Quiz
- Three buttons: **Back** (ghost) | **Leaderboard** (surface) | **Play Again** (primary)

---

## 13. CSS Animations & Transitions

All defined via an injected `<style>` tag:

```
cote-badge-in:    opacity 0→1, translateX(-50%) translateY(-8px)→(0), scale 0.95→1, 0.2s
cote-modal-in:    opacity 0→1, scale 0.96→1, translateY 8→0, 0.22s cubic-bezier(0.16,1,0.3,1)
cote-shake:       horizontal shake ±5px then ±4px, 0.35s (applied to input on bad guess)
cote-timer-warn:  opacity pulse 1→0.5→1, 1s infinite (last 60s of countdown)
cote-timer-critical: same pulse at 0.4s (last 10s)
```

CSS classes:
```
.cote-input         transition: border-color 0.15s, box-shadow 0.15s
.cote-input:focus   white border + subtle box-shadow glow
.cote-input-shake   applies shake animation + red border
.cote-btn           transition: background, border-color, transform, opacity (0.15s each)
.cote-btn:hover     slightly lighter background
.cote-btn:active    scale(0.97)
.cote-btn-primary   hover: opacity 0.9
.cote-tab           transition: color, border-color, background (0.15s)
.cote-tab:hover     white text
.cote-timer-pill    transition: background, color, border-color (0.15s)
.cote-chip          transition: background, color, border-color (0.25s)
.cote-region-row    transition: background (0.15s), hover slightly lighter
.cote-suggest-btn   transition: background, border-color, transform (0.15s)
```

---

## 14. Header

58px tall. Contains left to right:

1. **Globe icon** in a small circle + "COTE" wordmark (900 weight, uppercase)
2. Vertical divider
3. **Timer mode pills** — 4 buttons (10 min / 20 min / 30 min / ∞). Disabled once game is playing (opacity 0.35). Active pill has a subtle white-tinted background and border.
4. Vertical divider
5. **Time display** — "TIME" or "LEFT" micro label + monospace digits
6. Vertical divider
7. **Found counter** — "FOUND" micro label + "N / 197"
8. Vertical divider
9. Spacer (flex: 1)
10. **Give Up button** — only shown during `playing` state, red-tinted ghost button
11. **ⓘ button** — opens Instructions
12. **Trophy/Leaderboard button** — opens Leaderboard
13. **New Game button** — ghost style

---

## 15. User Flow

```
App loads
  → Welcome overlay
    → Click NEXT
      → Instructions overlay
        → Click PLAY
          → Game idle (globe spinning, input ready)
            → Start typing
              → Game playing (timer starts)
                → All 197 found → Perfect state → Play Again
                → Time expires → Results popup → Submit → Credits → Leaderboard or Play Again
                → Give Up → Results popup → Submit → Credits → Leaderboard or Play Again
```

---

## 16. Key Behaviours Summary

| Behaviour | Detail |
|-----------|--------|
| Auto-accept on type | No Enter needed for exact matches |
| Fuzzy accept on Enter | 1-character edit distance tolerance |
| Suggestion | Shown for ≥75% similar unguessed country |
| Globe spin | Always on, pauses during drag |
| Zoom | Double-click toggles 1× ↔ 1.6× |
| Continent auto-switch | Active tab follows each correct guess |
| Milestone badges | At 25, 50, 100, 150, 175 found |
| Continent completion | Special badge when all countries in a continent are found |
| Missed countries | Red fill on globe + red chips after game ends |
| Timer lock | Mode cannot be changed once typing begins |
| New Game guard | Confirm dialog if ≥1 country found during `playing` |
| Escape key | Closes Leaderboard, Credits, and mid-game Instructions |
| Share | Clipboard copy of Wordle-style result string |
