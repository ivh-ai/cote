# 07 — TECHNICAL ARCHITECTURE
## COTE: Countries of the Earth
### Production Architecture v1.0

> Source of truth: [00_MASTER_BLUEPRINT.md](00_MASTER_BLUEPRINT.md). Feature scope: [01_PRODUCT_REQUIREMENTS_DOCUMENT.md](01_PRODUCT_REQUIREMENTS_DOCUMENT.md). Modules: [05](05_GAME_ENGINE_SPECIFICATION.md), [06](06_GLOBE_RENDERING_SPEC.md), backend: [08](08_SUPABASE_SCHEMA.md).

---

## 1. Stack Decision (with rationale)

The brief lists Next.js, React, TypeScript, R3F, Three.js, Framer Motion, Zustand, Tailwind, shadcn/ui, and Supabase. Each is evaluated against the Blueprint §17.2 engineering framework, not adopted by default.

| Tech | Verdict | Rationale |
|------|---------|-----------|
| **React 18** | ✅ Adopt | Already in use; functional components + hooks (Blueprint §5.1) |
| **TypeScript** | ✅ Adopt | Blueprint §5.1 prefers TS for anything non-trivial; the game/globe modules have real data shapes. Migrate incrementally from the current JS |
| **Vite** | ✅ Keep | Current build tool; ideal for a **static SPA**; Blueprint §5.1 explicitly bans CRA and favors Vite |
| **Next.js** | ⚠️ **Not for v1.0** | COTE is a single static client-side game deployed to **GitHub Pages** (no server runtime). Next.js SSR/RSC add no value to a WebGL game and complicate static export + the `/cote/` base path. **Decision:** stay on Vite. *Reconsider Next.js only if* we need server API routes to hide Supabase writes behind our own endpoint or add accounts/SSR (roadmap v1.1). Documented as an ADR. |
| **React Three Fiber + Three.js** | ✅ Adopt (target) | The globe target ([06](06_GLOBE_RENDERING_SPEC.md)); replaces the current d3-SVG globe, which remains the fallback tier |
| **Framer Motion** | ✅ Adopt | UI motion ([04](04_MOTION_SPECIFICATION.md)); interruptible, reduced-motion-aware |
| **Zustand** | ⚠️ Optional | Blueprint §5.3 favors a single `useGameState` hook and **no external state lib** unless justified. Zustand is acceptable **only** as the internal implementation of that hook if it simplifies the globe-bridge + cross-component reads. Default: plain hook + context; adopt Zustand if it demonstrably reduces prop-drilling. Documented as ADR. |
| **Tailwind** | ⚠️ **Deviates from Blueprint** | Blueprint §5.1 currently mandates **CSS Modules + tokens, no Tailwind**. The brief requests Tailwind. This is a genuine standards conflict (Blueprint §17.4 governs). **Recommendation:** keep CSS Modules + CSS custom-property tokens (§03) for the bespoke, cinematic UI where Tailwind's utility soup fights the design precision; **if** the team ratifies Tailwind, update Blueprint §5.1 first and use it with the design tokens as the theme. Do not silently violate the Blueprint. |
| **shadcn/ui** | ⚠️ Selective | Useful for accessible primitives (Dialog, Tabs, Tooltip) with Radix under the hood — strong a11y baseline. Adopt **only the primitives we need**, restyled to the design system; do not import a generic look. Pairs with Tailwind if adopted; otherwise use Radix primitives directly with CSS Modules |
| **Supabase** | ✅ Adopt | Already wired for the leaderboard ([08](08_SUPABASE_SCHEMA.md)) |

**Net stack for v1.0:** Vite + React 18 + TypeScript + R3F/Three + Framer Motion + (single `useGameState` hook, optionally Zustand-backed) + CSS Modules/tokens (Tailwind pending Blueprint ratification) + Radix/shadcn primitives (selective) + Supabase.

> The two live conflicts (Next.js, Tailwind) are surfaced deliberately per the brief's instruction to challenge weak fits. Both are recorded as ADRs so the decision is explicit, not accidental.

---

## 2. Folder Structure

```
cote/
├── public/
│   ├── textures/            # earth day/normal/specular/clouds (self-hosted, compressed)
│   ├── data/                # countries-110m / 50m TopoJSON (pinned)
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── game/                # PURE logic (no React/DOM/Three) — see 05
│   │   ├── constants.ts
│   │   ├── countries.ts
│   │   ├── matching.ts
│   │   ├── milestones.ts
│   │   ├── achievements.ts
│   │   ├── scoring.ts
│   │   └── useGameState.ts
│   ├── globe/               # R3F module (no game imports) — see 06
│   │   ├── GlobeCanvas.tsx
│   │   ├── useGlobe.ts
│   │   ├── scene/ controls/ materials/ data/
│   │   └── legacy/          # d3-SVG fallback globe
│   ├── ui/                  # React components (imports game/ + globe/)
│   │   ├── components/      # Button, Input, Modal, Tabs, Card, Badge, Progress…
│   │   ├── screens/         # Welcome, Onboarding, Game, Results, Perfect
│   │   ├── overlays/        # Leaderboard, Statistics, Achievements, Instructions, About
│   │   └── tokens/          # colors/typography/spacing/animations CSS
│   ├── services/            # side-effectful integrations
│   │   ├── leaderboard.ts   # Supabase client + queries/RPC
│   │   ├── storage.ts       # localStorage stats/achievements (versioned)
│   │   └── analytics.ts     # (optional, privacy-respecting)
│   ├── hooks/               # generic reusable hooks (useReducedMotion, useMediaQuery…)
│   ├── lib/                 # framework-agnostic helpers (clipboard, sanitize, fetchJson)
│   ├── App.tsx
│   └── main.tsx
├── tests/                   # Vitest + RTL + Playwright mirrors of src/
├── 00…08 docs, README, CONTRIBUTING, DEPLOYMENT, CHANGELOG
├── vite.config.ts
└── package.json
```

Import rules (Blueprint §5.4, enforced by ESLint boundaries):
- `game/` imports nothing from `ui/`, `globe/`, or the DOM.
- `globe/` imports nothing from `game/` (state arrives via the bridge).
- `ui/` may import from `game/` and `globe/`; they never import `ui/`.
- `services/` is imported by `ui/` and hooks, never by `game/`.

---

## 3. Component Hierarchy

```
<App>
 ├─ <GlobeCanvas/>                 (persistent, bottom layer; ref API)
 ├─ <AppSurface>                   (AnimatePresence: one of…)
 │    ├─ <WelcomeScreen/>
 │    ├─ <OnboardingModal/>
 │    ├─ <GameScreen>
 │    │    ├─ <TopBar> <TimerPill/> <FoundCounter/> </TopBar>
 │    │    ├─ <ProgressBar/>
 │    │    ├─ <InputBar/>          (always-focused; suggestion)
 │    │    ├─ <ContinentPanel/>    (Tabs + chips)
 │    │    ├─ <UtilityCluster/>    (info/leaderboard/stats/achievements/new/give-up)
 │    │    └─ <TransientLayer/>    (found badge, feedback toast, achievement toast)
 │    ├─ <ResultsScreen/>
 │    └─ <PerfectScreen/>
 ├─ <ModalHost/>                   (0|1 of Leaderboard/Stats/Achievements/Instructions/About)
 ├─ <DialogHost/>                  (0|1 confirm dialog)
 └─ <ErrorBoundary/>               (app-level)
```

`GlobeCanvas` lives **outside** the `AnimatePresence` surface so it never unmounts on navigation (IA §1). The globe reads game state through `useGlobe`'s ref bridge, not props that trigger re-render.

---

## 4. State Management

Blueprint §5.3: one `useGameState` hook owns all game logic. Shape:

```ts
type GameState = 'idle' | 'playing' | 'finished';

interface GameStore {
  state: GameState;
  foundIds: Set<string>;          // authoritative; mirrored to a ref for the loop
  seconds: number;
  timerIdx: number;               // TIMER_MODES index
  lastBadge: Badge | null;
  suggestion: Country | null;
  feedback: Feedback | null;
  // actions
  guess(input: string, viaEnter: boolean): GuessResult;
  tick(): void;
  giveUp(): void;
  reset(force?: boolean): void;
  setTimerIdx(i: number): void;
}
```

- The hook wraps the pure `game/` functions; components subscribe to slices.
- A `guessedRef` mirrors `foundIds` for stale-closure-free reads in the loop/rapid guesses (Blueprint §13.2).
- UI-only state (which modal is open, onboarding flag) lives in a small `useUIState` (or the same store namespaced), separate from core game logic.
- **Zustand (if adopted)** is the internal implementation of these hooks — not scattered stores. Selectors are memoized to avoid needless re-renders (globe never subscribes).

---

## 5. API Layer

- All network I/O lives in `services/` (never in components or `game/`).
- `services/leaderboard.ts`: a single Supabase client; functions `getTop(mode, limit)`, `submitScore(entry)` (→ RPC/upsert, §[08]), each returning typed results and **never throwing into the UI** (return `{ ok, data | error }`).
- Timeouts + abort on all fetches; retries with backoff for idempotent reads.
- The leaderboard is **optional** to the game (NFR-REL-1): every call has a graceful failure path.

---

## 6. Utilities, Hooks, Services

- **`lib/sanitize.ts`** — name sanitization (strip control/HTML, clamp length) shared by submit + render.
- **`lib/clipboard.ts`** — `copy(text)` with Clipboard API + `execCommand` fallback + aria-live announce.
- **`hooks/useReducedMotion.ts`** — single source for the reduced-motion flag (globe + Framer read it).
- **`hooks/useAutoFocus.ts`** — re-focus the input after modal/dialog close and after accept.
- **`services/storage.ts`** — versioned localStorage (`cote_stats_v1`, `cote_achievements_v1`, `cote_onboarded`, `cote_lastName`), with safe JSON parse + migration hook.

---

## 7. Error Handling

- **App-level `<ErrorBoundary>`** → dignified fallback + Reload (IA §13); never a white screen.
- **Async boundaries:** every `service` call handles its own errors and returns typed results; the UI decides presentation (toast/inline/modal).
- **Globe:** WebGL context-loss listener → fall back to the SVG globe or a static frame; never crash the game.
- **No unhandled promise rejections** in committed code; `console.log` banned (Blueprint §18.7) — use a `lib/log.ts` gated on `import.meta.env.DEV`.

---

## 8. Security

Per Blueprint §16:
- **CSP:** strict; `script-src 'self'`; no inline scripts/eval; self-host textures/data to shrink `connect-src`/`img-src`; Supabase origin in `connect-src`.
- **Supabase anon key** is public by design; **all write safety lives in RLS/policies** ([08](08_SUPABASE_SCHEMA.md)), not the client.
- **Untrusted input:** player names sanitized before store and escaped on render (no `dangerouslySetInnerHTML`).
- **Deps:** `npm audit` gate before release; no known high/critical vulns; quarterly review.
- Third-party (Google Fonts) with `font-display: swap`; consider self-hosting Poppins to drop an external origin entirely.

---

## 9. Accessibility (architecture-level)

- Radix/shadcn primitives (Dialog, Tabs) give focus-trap, ESC, and ARIA for free — restyled, not restructured.
- `useReducedMotion` wired into both Framer variants and the globe loop.
- One `<h1>`, landmarked regions, skip-to-input link, `aria-live` progress region (throttled) — implemented in `ui/`.
- Lint: `eslint-plugin-jsx-a11y` in CI; axe checks in integration tests (Blueprint §12).

---

## 10. Performance & Build

- **Code splitting / lazy loading:** globe + Three chunk lazy-loaded after first paint; overlays (Leaderboard/Stats/Achievements/About) `React.lazy` — not on the critical path (Blueprint §11.1).
- **Manual chunks** (Vite/Rollup): `three` (+R3F/drei), `react`, app. Mirrors Blueprint §15.2.
- **Assets:** compressed textures (WebP/AVIF/KTX2), preloaded base tier; `world-atlas` self-hosted + pinned.
- **Budgets enforced** (Blueprint §11): gzipped JS < 400KB (Three in its own chunk), FCP < 1.5s, TTI < 3s, CLS < 0.1; Lighthouse in CI.
- **Build:** `vite build` with `base: '/cote/'` for GitHub Pages; `target: es2022`; sourcemaps off in prod.

Current `vite.config.js` (`base:'/cote/'`) is retained and extended with manualChunks and the TS config.

---

## 11. Testing & CI

- **Vitest** for `game/` (100% coverage gate), **React Testing Library** for `ui/` flows, **Playwright** for critical E2E (Blueprint §12).
- **CI gates** on every PR (Blueprint §14.4): typecheck, ESLint (incl. a11y + import-boundaries), unit + integration, build, Lighthouse (perf ≥90 / a11y =100), bundle-size check.
- Reduced-motion and keyboard-only paths are explicit test suites (not incidental).

---

## 12. ADRs to record

Per Blueprint §13.3, the non-obvious/deviating decisions get ADRs before implementation:
- `ADR-001` Vite over Next.js for a static WebGL SPA.
- `ADR-002` R3F globe with a permanent d3-SVG fallback tier.
- `ADR-003` Single `useGameState` hook; Zustand only as its backing (or not at all).
- `ADR-004` CSS Modules + tokens vs Tailwind (Blueprint §5.1 conflict resolution).
- `ADR-005` Selective Radix/shadcn primitives, restyled.
- `ADR-006` Client-side Supabase writes secured by RLS (no custom server in v1.0).

---

*Owned by the Staff Engineer. Deviations from the Blueprint are ADR'd and the Blueprint updated first (Blueprint §17.4) — never silently. Version 1.0.*
