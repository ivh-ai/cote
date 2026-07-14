# COTE — Countries of the Earth 🌍

A premium, desktop-first geography game: name all **197 countries** of the world from memory while each one illuminates on a photoreal, interactive 3D globe. Built to feel like a piece of Apple software — calm, cinematic, precise — rather than a browser game.

![Status](https://img.shields.io/badge/status-late--beta-orange) ![Tests](https://img.shields.io/badge/tests-80%20passing-brightgreen) ![Type](https://img.shields.io/badge/typescript-strict-blue)

---

## What it is

Type country names into a single, always-focused input. Correct answers are accepted instantly — no Enter required — and the country warms into its topographic biome colour on a spinning globe. Common names, abbreviations, historical names, and small typos all work. Find them all before the timer runs out, or play unlimited.

- **Two marquee modes:** 30-Minute Challenge and Unlimited (plus 10/20-minute options).
- **Forgiving matching:** aliases (USA, Britain), historical names (Burma → Myanmar), diacritic folding (São Tomé), and 1-typo fuzzy matching with "Did you mean?" suggestions.
- **A living globe:** React Three Fiber, lit ocean, atmosphere, biome-coloured countries, reveal animations.
- **Progress & reward:** per-continent tracking, milestones, an achievement system, and a rare perfect-game celebration.
- **Global leaderboard:** optional, no account required (Supabase).
- **Local stats:** games played, best scores, per-continent bests.

---

## Tech stack

| Concern | Choice |
|---------|--------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| 3D globe | Three.js + React Three Fiber + drei |
| Geo data | Natural Earth 110m (self-hosted TopoJSON) |
| Backend | Supabase (leaderboard) |
| Styling | CSS + design tokens (no Tailwind) |
| Tests | Vitest (+ coverage) |

See [07_TECHNICAL_ARCHITECTURE.md](07_TECHNICAL_ARCHITECTURE.md) for the full rationale (including why not Next.js).

---

## Getting started

**Prerequisites:** Node 18+ and npm.

```bash
npm install
npm run dev        # → http://localhost:5173/cote/
```

> Note the `/cote/` base path (configured for GitHub Pages).

### Scripts

| Script | Does |
|--------|------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm test` | Run the unit test suite (Vitest) |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run lint` | Lint (oxlint) |

---

## Project structure

```
src/
├── game/       # pure game logic — no React/DOM/Three (100% unit-tested)
├── globe/      # React Three Fiber globe module (self-contained)
├── ui/         # React components, screens, overlays, design tokens
├── services/   # localStorage stats + Supabase leaderboard
├── lib/        # framework-agnostic helpers (clipboard, sanitize)
└── App.tsx     # composition: persistent globe + surfaces + modal host
public/data/    # self-hosted Natural Earth TopoJSON
```

Strict import boundaries: `game/` imports nothing UI/globe; `globe/` imports no game logic; `ui/` wires them together. See [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md).

---

## Documentation

This project is documentation-driven. The specs are the source of truth:

| Doc | Purpose |
|-----|---------|
| [00_MASTER_BLUEPRINT.md](00_MASTER_BLUEPRINT.md) | The project constitution — standards & non-negotiables |
| [01_PRODUCT_REQUIREMENTS_DOCUMENT.md](01_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Product requirements |
| [02_INFORMATION_ARCHITECTURE.md](02_INFORMATION_ARCHITECTURE.md) | Screens, flows, navigation |
| [03_DESIGN_SYSTEM.md](03_DESIGN_SYSTEM.md) | Colour, type, components |
| [04_MOTION_SPECIFICATION.md](04_MOTION_SPECIFICATION.md) | Animation language |
| [05_GAME_ENGINE_SPECIFICATION.md](05_GAME_ENGINE_SPECIFICATION.md) | Game rules & logic |
| [06_GLOBE_RENDERING_SPEC.md](06_GLOBE_RENDERING_SPEC.md) | The 3D globe |
| [07_TECHNICAL_ARCHITECTURE.md](07_TECHNICAL_ARCHITECTURE.md) | Architecture & stack |
| [08_SUPABASE_SCHEMA.md](08_SUPABASE_SCHEMA.md) | Backend & data model |
| [09_QA_REPORT.md](09_QA_REPORT.md) | Current QA state & known issues |

Deployment: [DEPLOYMENT.md](DEPLOYMENT.md) · Contributing: [CONTRIBUTING.md](CONTRIBUTING.md) · Changes: [CHANGELOG.md](CHANGELOG.md)

---

## Current status

**Late beta.** The core experience is complete, playable, and unit-tested (80 tests, 100% of pure game logic). Before it's a release candidate, the P0 items in [09_QA_REPORT.md](09_QA_REPORT.md) remain — chiefly: apply the Supabase anti-cheat migrations, run the accessibility (axe + screen-reader) and Lighthouse audits, add an error boundary, and remove the legacy monolith. See the QA report for the full, honest list.

---

## Credits

Desktop-first and free to play. Globe geometry from [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas). Built with React Three Fiber and Three.js.

## License

Not yet specified — add a `LICENSE` file before public release.
