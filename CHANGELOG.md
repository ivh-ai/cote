# Changelog

All notable changes to COTE are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/); the project aims to follow [Semantic Versioning](https://semver.org/).

## [Unreleased] — COTE rebuild (late beta)

A ground-up rebuild of COTE onto a documented, tested, modular architecture (Vite + TypeScript + React Three Fiber), replacing the original single-file d3/SVG implementation.

### Added
- **Specification suite** (source of truth): Master Blueprint, PRD, Information Architecture, Design System, Motion Spec, Game Engine Spec, Globe Rendering Spec, Technical Architecture, Supabase Schema, QA Report (docs `00`–`09`).
- **React Three Fiber globe** (`src/globe/`): lit ocean sphere, Fresnel atmosphere, starfield, biome-coloured country meshes projected onto the sphere, reveal tweens, missed-state rendering. Self-contained module controlled imperatively via a ref API.
- **Geo pipeline**: self-hosted Natural Earth 110m TopoJSON → sphere geometry with edge tessellation, antimeridian-seam handling, and largest-polygon centroids.
- **Pure game engine** (`src/game/`): normalization with diacritic folding, exact/fuzzy/suggestion matching, milestones, continent completion, scoring, and a pure state machine (`engine.ts`) — 100% unit-tested.
- **Achievement system**: 13 achievements with idempotent evaluation.
- **`useGameState` hook**: the single seam wiring pure logic to the globe and persistence; strict-mode-safe single timer; batched globe updates; one-shot finish commit.
- **Services**: versioned localStorage stats/achievements (with a pure `foldGame` reducer); Supabase leaderboard client that prefers a hardened RPC and falls back gracefully.
- **UI** (`src/ui/`): earthy design-system tokens; Welcome, Game HUD (top bar, always-focused input with suggestions, continent panel, transient badges), Results/Perfect screens; Leaderboard, Instructions, About, Stats, and Achievements modals; focus-trapped modals and confirm dialogs.
- **Tests**: 80 unit tests (Vitest) across matching, scoring, milestones, achievements, engine, storage, and sanitize; coverage reporting.
- **Launch docs**: README, CONTRIBUTING, DEPLOYMENT, PROJECT_ARCHITECTURE.

### Changed
- Migrated from JavaScript to **strict TypeScript** with `@/*` path aliases.
- Replaced the d3-geoOrthographic SVG globe with the React Three Fiber globe.
- Introduced a warmer, brighter visual pass: warm sand-charcoal glass surfaces, a brighter azure ocean with a stronger warm key light, lighter unfound-country colour, and a tighter atmosphere rim.
- Globe interaction: drag now spins on the **vertical axis only** (removed the gyro/tumble); the globe stays upright.
- Vite config updated for Vite 8 / rolldown (`manualChunks` as a function) and code-split chunks (`three`, `react`, app).
- Leaderboard scoring/submission logic moved into a typed, non-throwing service.

### Hardening (P0 pass)
- Added an app-level `ErrorBoundary` (dignified fallback + reload; never a white screen).
- Removed the legacy `WorldCountriesGame.jsx` monolith and the `d3` dependency (dead code).
- Enabled `jsx-a11y` lint rules; cleared all lint warnings; `npm run lint` and `npm run typecheck` are clean.
- Authored the Supabase anti-cheat migrations (`supabase/migrations/`, ready to apply): hardened `leaderboard` table, RLS (public read, no direct writes), the `submit_score` security-definer RPC (server-computed score + plausibility checks + atomic upsert), and a legacy-table backfill.
- **Accessibility:** axe-core audit → 0 violations (wcag2a/aa) on Welcome and Game surfaces; measured contrast table added ([03_DESIGN_SYSTEM.md](03_DESIGN_SYSTEM.md) §23); fixed two contrast defects (`--stone-600` misused as small text → `--stone-400`; `--danger` `#c4553d`→`#d46e54` for AA at small sizes).
- **Performance:** lazy-loaded the globe (`React.lazy` + `Suspense`) so Three.js loads after first paint — Lighthouse (desktop) Performance **99**, Accessibility **100**, Best-practices **100**, CLS 0.03.
- **Tests:** added integration tests (React Testing Library + jsdom, globe mocked) covering welcome→start→focus, exact/alias/fuzzy acceptance, give-up→results, and onboarding/modal behaviour — **87 tests total, all passing**.
- **CI:** added a `ci.yml` workflow (typecheck + lint + test + build on push/PR) and gated the Pages deploy workflow on the same checks.

### Fixed
- Diacritic input (e.g. "São Tomé", "Côte d'Ivoire") now resolves via NFD folding (previously relied on aliases only).
- Antimeridian-crossing country polygons no longer produce seam slivers on the globe.
- Multi-territory countries (France + Guiana, USA + Alaska/Hawaii) compute a sensible centroid (largest polygon by area).
- Replaced the browser `window.confirm` in reset with a styled, accessible confirm dialog.

### Deliberately deferred / not a regression
- **Per-guess auto-rotate-to-country** removed to avoid disorienting globe movement (motion spec §3.9); the API remains for a future end-of-game missed reveal.
- **Photoreal globe textures** and a **50m LOD tier** (which would add the ~23 micro-states not present at 110m) are not yet implemented.

### Known issues (see [09_QA_REPORT.md](09_QA_REPORT.md))
- **Supabase anti-cheat migrations authored but not yet applied** — the leaderboard is not cheat-resistant until they are (the one remaining launch blocker).
- No integration/E2E tests yet; human screen-reader pass pending.
- WebGL context exhaustion after many dev hot-reloads (dev-environment only; production loads render correctly).

---

## [0.0.0] — Original prototype

- Single-file `WorldCountriesGame.jsx`: 197-country game with a d3-geoOrthographic SVG globe, fuzzy matching, continent tracking, and a Supabase leaderboard. Deployed to GitHub Pages. Retained temporarily as reference; slated for removal.
