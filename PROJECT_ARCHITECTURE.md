# Project Architecture (as-built)

This is the **as-built** architecture — how COTE is actually structured today. It is the practical companion to the design-time [07_TECHNICAL_ARCHITECTURE.md](07_TECHNICAL_ARCHITECTURE.md); where they differ, this file describes reality.

---

## 1. Overview

COTE is a static React 19 + TypeScript SPA built with Vite 8. It has one persistent WebGL globe (React Three Fiber) with UI surfaces layered above it. All game logic is pure and testable; the globe is controlled imperatively so it never re-renders on gameplay; side effects (storage, network) are isolated in a services layer.

```
                 ┌──────────────────────────────────────────┐
   user input →  │  ui/  (React components, screens, modals) │
                 └───────────────┬──────────────────────────┘
                                 │ calls
                    ┌────────────▼───────────┐        ┌─────────────┐
                    │  game/useGameState hook │◄──────►│  services/  │
                    │  (wraps pure engine)    │  read/ │ storage,    │
                    └───────┬─────────┬───────┘  write │ leaderboard │
              pure calls    │         │ imperative      └─────────────┘
                    ┌───────▼───┐  ┌──▼──────────────┐
                    │  game/    │  │  globe/         │
                    │ (pure fns)│  │ GlobeCanvas ref │→ Three.js scene
                    └───────────┘  └─────────────────┘
```

---

## 2. Module boundaries

Enforced by convention (and, once wired, ESLint import rules):

| Layer | May import | Must NOT import |
|-------|-----------|-----------------|
| `game/` | nothing app-specific | React, DOM, Three.js, ui/, globe/, services/ |
| `globe/` | Three.js, R3F | game/ logic |
| `ui/` | game/, globe/, services/, lib/ | — |
| `services/` | lib/, game/ (types/pure) | ui/, globe/ |
| `lib/` | nothing | everything else |

The one exception is `game/useGameState.ts`: it is the *bridge* hook and therefore imports React, the globe's `GlobeApi` type, and services. It is the single seam between pure logic and the outside world.

---

## 3. Directories

```
src/
├── game/
│   ├── constants.ts        TIMER_MODES, MILESTONES, named durations/thresholds
│   ├── countries.ts        ALL_COUNTRIES (197), CONTINENT_OF, BY_CONTINENT
│   ├── matching.ts         normalize (+diacritics), exact/fuzzy/suggest
│   ├── milestones.ts       checkMilestone, isContinentComplete, continentProgress
│   ├── achievements.ts     ACHIEVEMENTS + evaluateAchievements
│   ├── scoring.ts          computeScore, formatTime
│   ├── engine.ts           PURE state machine: applyGuess, tick, giveUp, reset
│   └── useGameState.ts     the bridge hook (React + globe + persistence)
├── globe/
│   ├── GlobeCanvas.tsx     the only React↔globe seam; exposes GlobeApi via ref
│   ├── data/
│   │   ├── geo.ts          TopoJSON → sphere geometry, centroids, tessellation
│   │   └── topoColors.ts   biome colour map, land/missed colours
│   ├── scene/
│   │   ├── Earth.tsx       lit ocean sphere
│   │   ├── Atmosphere.tsx  Fresnel rim shader
│   │   └── Countries.tsx   per-country meshes + batched fill/found/missed + tweens
│   └── controls/
│       └── GlobeControls.tsx  drag-spin (Y axis only), zoom, auto-spin, rotate-to
├── ui/
│   ├── components/         Button, Modal, ConfirmDialog, TopBar, InputBar, ContinentPanel, TransientLayer
│   ├── screens/            WelcomeScreen, ResultsScreen (+ Perfect variant)
│   ├── overlays/           Leaderboard, Instructions, About, Stats, Achievements
│   └── tokens/tokens.css   design tokens (colour, spacing, motion, glass)
│   └── styles.css          interaction classes + keyframes
├── services/
│   ├── storage.ts          versioned localStorage (stats/achievements/prefs); pure foldGame
│   └── leaderboard.ts      Supabase: RPC-first submit + REST fallback, graceful
├── lib/
│   ├── sanitize.ts         name sanitization
│   └── clipboard.ts        copy with fallback
└── App.tsx                 composition root
```

---

## 4. Data flow (a single guess)

```
InputBar.onChange(value)
  → useGameState.handleChange
      → engine.applyGuess(state, value, viaEnter=false)   // pure
          → matching.exactMatch                            // pure
      → on 'found':
          commit(next)                     // setState + globeApi.updateCountries(foundIds, status)
          showBadge(badge)                 // transient, auto-dismiss
          clear input + suggestion
  → React re-renders the UI (counter, continent panel)
  → GlobeCanvas does NOT re-render; Countries layer tweens the new fill in useFrame
```

The globe's `Countries` layer reads found state from a ref set by `updateCountries` and animates colour in its own `useFrame` loop — React reconciliation is never involved in a reveal.

---

## 5. State ownership

| State | Owner | Persistence |
|-------|-------|-------------|
| Game FSM (status, foundIds, seconds, timerIdx) | `useGameState` (via pure `engine`) | in-memory |
| Transient UI (badge, feedback, suggestion, input) | `useGameState` | in-memory |
| Which surface/modal/dialog is open | `App.tsx` | in-memory |
| Globe rotation/zoom/found visuals | `globe/` internals (refs) | in-memory |
| Stats, achievements, onboarding, last name | `services/storage` | localStorage (versioned) |
| Leaderboard | Supabase | remote |

No external state library — a single hook plus small local state, per Blueprint §5.3.

---

## 6. The globe bridge (why it's structured this way)

Blueprint §6.1 requires the globe to be self-contained and to never read React state directly. Implementation:

- `GlobeCanvas` is a `forwardRef` exposing `GlobeApi`: `updateCountries(foundIds, status)`, `rotateToCountry(id)`, `toggleZoom()`, `reset()`.
- Internally it holds refs to the country-layer API and the controls API; the imperative handle forwards to them.
- Game state flows **in** via `updateCountries` (a batched call, not per-country). Nothing flows back except through user interaction.
- This keeps a 60fps render loop fully decoupled from React's render cycle.

---

## 7. Build & delivery

- Vite manual chunks: `three`, `react`, app.
- Geo data self-hosted under `public/data/`.
- Base path `/cote/` for GitHub Pages.
- See [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 8. Known deviations from doc 07

| Design (doc 07) | As-built | Reason |
|-----------------|----------|--------|
| Framer Motion for UI motion | CSS keyframes + tokens | Lighter, sufficient for current animations; revisit if complex orchestration is needed |
| Zustand optional | Plain hook + local state | Game is simple enough to not need it (Blueprint §5.3) |
| Tailwind (brief) vs CSS Modules (Blueprint) | Inline styles + tokens + a shared `styles.css` | Blueprint §5.1 governs; bespoke cinematic UI favours precise tokens over utilities |
| Photoreal globe textures | Lit materials (no texture maps yet) | Fidelity gap tracked in [09_QA_REPORT.md](09_QA_REPORT.md) §6 |
| Per-guess rotate-to-country | Disabled | Avoids disorienting globe-yanking (doc 04 §3.9); API retained |

These are recorded rather than hidden; formal ADRs live (or will live) in `docs/adr/`.
