# 00 — MASTER BLUEPRINT
## COTE: Countries of the Earth
### Project Constitution v1.0

---

> *"Details are not the details. They make the design."*
> — Charles Eames

---

## Table of Contents

1. [Project Philosophy](#1-project-philosophy)
2. [Product Vision](#2-product-vision)
3. [Team Structure & Ownership](#3-team-structure--ownership)
4. [Design Principles](#4-design-principles)
5. [Engineering Standards](#5-engineering-standards)
6. [Architecture Principles](#6-architecture-principles)
7. [File Organization & Naming](#7-file-organization--naming)
8. [Component Standards](#8-component-standards)
9. [Animation & Motion](#9-animation--motion)
10. [Accessibility Standards](#10-accessibility-standards)
11. [Performance Budgets](#11-performance-budgets)
12. [Testing Methodology](#12-testing-methodology)
13. [Documentation Requirements](#13-documentation-requirements)
14. [Git Workflow](#14-git-workflow)
15. [Deployment Strategy](#15-deployment-strategy)
16. [Security Principles](#16-security-principles)
17. [Decision-Making Framework](#17-decision-making-framework)
18. [Non-Negotiables](#18-non-negotiables)

---

## 1. Project Philosophy

### 1.1 The Single Sentence

COTE exists to make the act of learning the world's countries feel like a privilege, not a task.

### 1.2 The Standard We Hold Ourselves To

Every decision made on this project — from the easing curve on a button press to the sequence of a database query — is evaluated against one question:

**Would this feel at home in an Apple product?**

This is not about imitation. It is about internalising a standard: that software can be crafted to the point where it feels inevitable. Where every interaction feels as though it could not have been designed any other way.

We are not building a game. We are building an experience that happens to be a game.

### 1.3 What We Are Building

A premium desktop web application. A single-page experience where players attempt to name all 197 countries in the world from memory. As each country is typed, it illuminates on a photorealistic spinning globe rendered in Three.js. The interface recedes into the background, leaving only the player, their knowledge, and the Earth.

### 1.4 What We Are Not Building

- A feature-complete product with every possible option
- A mobile-first experience (desktop is the primary target)
- A social platform
- An educational app with hints, flashcards, or teaching modes
- Anything that feels like it was built in a weekend

### 1.5 The Promise to the Player

When someone sits down to play COTE, they should feel:

1. **Calm** — the interface does not compete for attention
2. **Capable** — the controls are instantly understood without instruction
3. **Immersed** — the globe feels alive; the world feels real
4. **Rewarded** — every correct answer delivers a moment of genuine satisfaction
5. **Respected** — the product treats them as intelligent adults

---

## 2. Product Vision

### 2.1 Core Experience

The player faces a slowly rotating photorealistic globe on a deep black canvas. They type country names. Each correct answer produces a precise, satisfying micro-moment: the country reveals its topography, a subtle pulse radiates from its location, and the input clears with quiet confidence.

The game asks nothing of the player except their knowledge. No tutorials demanded. No popups interrupting focus. No visual noise.

### 2.2 The Five Screens

| Screen | Purpose | Tone |
|--------|---------|------|
| Welcome | Orient and invite | Quiet, confident |
| Instructions | Inform without overwhelming | Clear, minimal |
| Game | The experience itself | Immersive, focused |
| Results | Honest reflection on performance | Dignified, not punishing |
| Perfect State | Celebrate mastery | Rare, earned, memorable |

### 2.3 Success Metrics

A successful version of COTE is one where:

- A first-time player understands how to play without reading anything
- A returning player notices something new every session (the globe rendering, a subtle animation)
- Players share their results not because they're prompted to, but because they're proud
- The application loads in under 2 seconds on a standard connection
- Zero accessibility-related barriers prevent any user from playing

### 2.4 Out of Scope (v1)

- Mobile / touch support
- Multiplayer
- Custom country sets or difficulty modes
- Sound design
- User accounts or persistent profiles

---

## 3. Team Structure & Ownership

### 3.1 Role Responsibilities

**Principal Product Manager**
Owns the product vision, feature prioritisation, and user flow decisions. All scope changes require PM sign-off. Writes and maintains user stories. Final arbiter of "does this feel right."

**Staff Software Engineer**
Owns architecture decisions, engineering standards, and technical direction. Reviews all PRs that touch core infrastructure. Writes the technical sections of this document and keeps them current.

**Senior Frontend Engineer**
Owns component architecture, state management, and React patterns. Responsible for performance on the critical rendering path. Pairs with the Graphics Engineer on globe integration.

**Senior Backend Engineer**
Owns data layer, API design, and any server-side concerns. Responsible for ensuring stateless operations are truly stateless and that no backend dependency blocks the core game experience.

**Three.js Graphics Engineer**
Sole owner of the globe rendering system. All globe-related code lives in its own isolated module. No other team member merges changes to globe internals without Graphics Engineer review.

**Apple Human Interface Designer**
Owns the visual language, spacing system, typography, and color. Produces final design specs before any feature is implemented. No component ships without design review.

**Motion Designer**
Owns all animation specifications. Produces timing curves, duration tables, and interaction choreography. Works directly with the Frontend Engineer on implementation. All animations require Motion Designer approval before shipping.

**UX Researcher**
Owns user flow validation and cognitive load assessment. Conducts playtesting sessions before major milestones. Flags friction points. Has veto power over flows that create confusion.

**Accessibility Specialist**
Owns WCAG compliance, keyboard navigation architecture, and screen reader behaviour. Reviews every new component. No feature ships without accessibility sign-off.

**Performance Engineer**
Owns performance budgets, rendering benchmarks, and load time targets. Runs performance audits at every major milestone. Blocks releases that violate performance budgets.

**QA Lead**
Owns test coverage, regression testing, and release readiness. Maintains the test matrix. No release without QA sign-off.

### 3.2 Decision Hierarchy

```
Product Vision (PM)
  └── Design (HI Designer + Motion Designer)
        └── Architecture (Staff Engineer)
              └── Implementation (Senior FE + BE + Graphics)
                    └── Quality (Accessibility + Performance + QA)
```

Decisions move downward. Quality gates move upward and can block.

---

## 4. Design Principles

### 4.1 The Seven Laws

**I. The Globe is the Product**
Every UI element exists to serve the globe experience. If an element competes with the globe for attention, it is wrong. Headers, panels, and inputs should feel like they dissolve into the background.

**II. Earn Every Pixel**
No element is placed without purpose. No padding is arbitrary. No color is decorative. Every visual decision must be justified by function or by deliberate emotional intent.

**III. Motion Has Meaning**
Animation is not decoration. Every transition communicates something: a state change, a spatial relationship, a confirmation. If you cannot explain what an animation communicates, remove it.

**IV. Trust the User**
No confirmation dialogs for reversible actions. No tooltips for obvious controls. No onboarding flows that treat the user as incompetent. Instructions are available; they are not forced.

**V. Silence is a Feature**
White space, dark space, and silence are active design tools. A screen that feels empty is often a screen that is working correctly. Do not fill space to fill space.

**VI. Consistency is Credibility**
Identical actions produce identical results everywhere in the product. Identical elements look identical everywhere. If two buttons serve different purposes, they look different. If they serve the same purpose, they look identical.

**VII. The Last 10% is the Product**
The difference between a product that feels good and one that feels exceptional is entirely in the final refinement pass. Easing curves. Exact border radii. Sub-pixel alignment. This work is not polish — it is the product.

### 4.2 Visual Language

**Philosophy:** Reduce until it breaks, then add back exactly one thing.

**Color System:**
- One true black (`#080808`) — the canvas everything lives on
- One true white (`#ffffff`) — the text, the UI, the found states
- Semantic greens for success, semantic reds for missed/warning
- No decorative colors. No gradients in UI chrome. Gradients only on the globe.

**Typography:**
- One typeface family: Poppins
- Weight carries hierarchy: 900 for brand, 700 for headings, 500 for labels, 400 for body
- Monospace (system) for timer digits only — tabular numerals prevent layout shift

**Spacing:**
- 4px base unit. All spacing is a multiple of 4.
- Consistent scale: 4, 8, 12, 16, 24, 32, 48, 64

**Border Radius:**
- Cards / Modals: 14px
- Buttons: 8px
- Chips / Tags: 4px
- Pills / Badges: 999px

**Elevation:**
- No drop shadows on UI chrome
- Modals use backdrop blur (`blur(10px)`) + semi-transparent overlay for depth
- The globe is the only element with perceived physical depth

### 4.3 Interaction Design

**Response time:** Every interaction must produce visible feedback within 100ms.

**Touch targets:** Minimum 44×44px for all interactive elements (desktop standard).

**Cursor:** `cursor: pointer` on every clickable element, always.

**Focus states:** Visible, styled, never `outline: none` without a replacement.

**Hover states:** All interactive elements have distinct hover states. Transition: 150ms ease.

**Active states:** Scale to 0.97 on press for buttons. 150ms ease-out.

---

## 5. Engineering Standards

### 5.1 Language & Framework

- **React 18** with functional components and hooks only. No class components.
- **Vite** as the build tool. No Create React App.
- **JavaScript (ES2022+)**. TypeScript is preferred for any module exceeding 200 lines or with complex data shapes — enforce with JSDoc types at minimum.
- **Three.js** for globe rendering. D3 only for geographic projection math where Three.js is insufficient.
- **No CSS frameworks.** No Tailwind. No styled-components. CSS Modules for component styles, a single global CSS file for design tokens and keyframes.

### 5.2 Code Quality

**Every line of code must be:**

- **Readable** — a competent engineer unfamiliar with this codebase should understand any function within 30 seconds
- **Intentional** — no code that exists "just in case" or "we might need this later"
- **Tested** — any function with non-trivial logic has a unit test
- **Documented** — any function that is not self-evident has a JSDoc comment explaining *why*, not *what*

**Forbidden patterns:**

```javascript
// ❌ Magic numbers
setTimeout(fn, 2500);

// ✅ Named constants
const BADGE_DISPLAY_DURATION_MS = 2500;
setTimeout(fn, BADGE_DISPLAY_DURATION_MS);

// ❌ Inline styles for design values
<div style={{ color: '#888888' }}>

// ✅ CSS custom properties
<div className={styles.mutedText}>

// ❌ Boolean props that reverse meaning
<Button disabled={!isActive}>

// ✅ Explicit intent
<Button isDisabled={!isActive}>

// ❌ Nested ternaries
const x = a ? b ? c : d : e;

// ✅ Early returns or named variables
```

**Required patterns:**

- Constants in `SCREAMING_SNAKE_CASE` at module top level
- Component props destructured in function signature
- All `useEffect` dependencies explicitly listed — no suppressions
- All async functions handle errors explicitly
- No `console.log` in committed code (use a logger utility)

### 5.3 State Management

- **Local state:** `useState` for UI state that doesn't cross component boundaries
- **Shared game state:** A single `useGameState` hook that encapsulates all game logic
- **Globe state:** Isolated within the globe module, exposed only through a ref-based API
- **No Redux, Zustand, or external state libraries** — the game is simple enough to not require them; if it grows to require them, that is a design smell

### 5.4 Module Boundaries

The codebase is divided into three domains with strict import rules:

```
game/       — game logic, state, algorithms (no UI imports)
globe/      — Three.js rendering (no game logic imports)
ui/         — React components (imports from game/ and globe/ but they don't import each other)
```

Crossing these boundaries requires a documented justification.

---

## 6. Architecture Principles

### 6.1 The Globe Module

The Three.js globe is a self-contained module. It:

- Owns its own canvas, renderer, scene, camera, and animation loop
- Exposes a clean imperative API: `highlightCountry(id)`, `markMissed(id)`, `rotateTo(lon, lat)`, `setRotationEnabled(bool)`
- Never reads from React state directly — it receives updates through a ref-based bridge
- Manages its own memory: disposes of geometries, materials, and textures on unmount
- Runs at a fixed 60fps budget; drops to 30fps gracefully on constrained hardware

### 6.2 The Game Logic Module

All game logic is pure JavaScript — no React, no DOM, no Three.js:

- `normalize(input)` — string normalization
- `exactMatch(input)` — O(1) lookup
- `fuzzyMatch(input)` — Levenshtein 1-error tolerance
- `suggestMatch(input)` — similarity scoring for "Did you mean?"
- `checkMilestone(count, continent)` — determines badge type
- `formatTime(seconds)` — MM:SS formatting

These functions are unit tested independently of any UI.

### 6.3 Data Flow

```
User Input → Game Logic → State Update → React Re-render → Globe API call
                                                         ↕
                                               UI Components
```

The globe is never re-rendered by React. It is controlled imperatively. React owns the UI. The globe owns itself.

### 6.4 Performance Architecture

- Globe renders on a `<canvas>` with `requestAnimationFrame`; React never causes a globe re-render
- Country fill updates are batched: a single `updateCountries(guessedIds)` call, not one call per country
- Expensive operations (fuzzy matching across 197 countries) are debounced at 150ms
- TopoJSON / GeoJSON data is parsed once at startup and cached; never re-parsed
- Three.js assets (textures, geometries) are loaded asynchronously; loading state is shown until ready

---

## 7. File Organization & Naming

### 7.1 Directory Structure

```
cote/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── game/
│   │   ├── constants.js          — TOTAL, TIMER_MODES, CONTINENTS, etc.
│   │   ├── countries.js          — ALL_COUNTRIES array
│   │   ├── matching.js           — normalize, exactMatch, fuzzyMatch, suggestMatch
│   │   ├── milestones.js         — checkMilestone, MILESTONE_COUNTS
│   │   ├── scoring.js            — formatTime, computeScore
│   │   └── useGameState.js       — single game state hook
│   ├── globe/
│   │   ├── GlobeRenderer.js      — Three.js scene, camera, renderer
│   │   ├── GlobeControls.js      — drag, zoom, auto-spin
│   │   ├── GlobeMaterials.js     — country materials, ocean shader
│   │   ├── topoColors.js         — TOPO_COLOR lookup
│   │   └── useGlobe.js           — React hook bridging globe to components
│   ├── ui/
│   │   ├── components/
│   │   │   ├── Header/
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Header.module.css
│   │   │   ├── InputBar/
│   │   │   ├── ProgressBar/
│   │   │   ├── ContinentPanel/
│   │   │   ├── Badge/
│   │   │   ├── Modal/
│   │   │   └── Button/
│   │   ├── screens/
│   │   │   ├── WelcomeScreen.jsx
│   │   │   ├── InstructionsScreen.jsx
│   │   │   ├── GameScreen.jsx
│   │   │   ├── ResultsScreen.jsx
│   │   │   └── PerfectScreen.jsx
│   │   └── tokens/
│   │       ├── colors.css         — CSS custom properties
│   │       ├── typography.css
│   │       ├── spacing.css
│   │       └── animations.css
│   ├── App.jsx
│   └── main.jsx
├── tests/
│   ├── game/
│   │   ├── matching.test.js
│   │   ├── milestones.test.js
│   │   └── scoring.test.js
│   └── ui/
│       └── components/
├── 00_MASTER_BLUEPRINT.md
├── COTE_Spec.md
├── vite.config.js
├── package.json
└── README.md
```

### 7.2 Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| React components | PascalCase | `InputBar.jsx` |
| Hooks | camelCase prefixed `use` | `useGameState.js` |
| CSS Modules | camelCase | `styles.mutedText` |
| CSS custom properties | kebab-case | `--color-text-muted` |
| Constants | SCREAMING_SNAKE_CASE | `TOTAL_COUNTRIES` |
| Event handlers | camelCase prefixed `handle` | `handleKeyDown` |
| Boolean props | prefixed `is` or `has` | `isDisabled`, `hasError` |
| Test files | same name + `.test` | `matching.test.js` |

### 7.3 Import Order

Within every file, imports follow this order with blank lines between groups:

```javascript
// 1. React
import { useState, useEffect, useRef } from 'react';

// 2. Third-party libraries
import * as THREE from 'three';

// 3. Internal — game logic
import { exactMatch, fuzzyMatch } from '@/game/matching';

// 4. Internal — components
import { Modal } from '@/ui/components/Modal';

// 5. Styles
import styles from './Component.module.css';
```

---

## 8. Component Standards

### 8.1 Component Anatomy

Every component follows this structure:

```jsx
// 1. Imports
// 2. Types / PropTypes
// 3. Constants local to this component
// 4. Component function
//    a. Destructured props
//    b. Hooks (in consistent order: state, refs, derived values, effects)
//    c. Event handlers
//    d. Return / JSX
// 5. Default export
```

### 8.2 Props

- All props are explicitly typed (JSDoc or TypeScript)
- No prop spreading (`{...props}`) without explicit justification
- Default values declared in function signature, not `defaultProps`
- Required props have no default; optional props always have a default

### 8.3 Size Limits

| Unit | Limit |
|------|-------|
| Component file | 200 lines |
| Hook file | 150 lines |
| Function | 40 lines |
| JSX nesting depth | 5 levels |

Exceeding these limits requires a documented justification and refactor plan.

### 8.4 The Button Contract

All buttons in the application use the `Button` component. No raw `<button>` elements except inside `Button`. The Button component guarantees:

- `cursor: pointer`
- `type="button"` (unless explicitly `type="submit"`)
- `aria-label` when icon-only
- Disabled state handled semantically (`aria-disabled` + no interaction)
- Hover, active, and focus states

---

## 9. Animation & Motion

### 9.1 Philosophy

Animations serve three purposes in COTE:
1. **Orientation** — they tell the user where they are in space
2. **Confirmation** — they confirm that an action succeeded
3. **Delight** — occasional moments that reward attention

Any animation that serves none of these purposes is removed.

### 9.2 The Duration Scale

| Name | Duration | Use |
|------|----------|-----|
| `instant` | 0ms | State changes where animation would feel sluggish |
| `micro` | 100ms | Button press feedback, hover transitions |
| `fast` | 200ms | Badge entrance, input feedback |
| `standard` | 300ms | Modal entrance/exit, tab switches |
| `expressive` | 500ms | Globe rotation to found country |
| `globe` | 400–600ms | Zoom transitions |

All durations are defined as CSS custom properties and JS constants. No hardcoded `ms` values in component code.

### 9.3 Easing Curves

| Name | Curve | Use |
|------|-------|-----|
| `ease-out` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Elements entering the screen |
| `ease-in` | `cubic-bezier(0.4, 0.0, 1, 1)` | Elements leaving the screen |
| `ease-in-out` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Elements moving within the screen |
| `spring` | `cubic-bezier(0.16, 1, 0.3, 1)` | Bouncy, physical entrances (badge, modal) |
| `linear` | `linear` | Opacity pulses, continuous loops only |

### 9.4 Required Animations

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| Modal opens | Scale 0.96→1 + fade in | 220ms | spring |
| Modal closes | Scale 1→0.96 + fade out | 150ms | ease-in |
| Badge appears | Slide down + fade in | 200ms | spring |
| Country found | Globe highlight pulse | 300ms | ease-out |
| Bad guess input | Horizontal shake | 350ms | ease-in-out |
| Timer warning | Opacity pulse | 1000ms | linear, infinite |
| Timer critical | Opacity pulse fast | 400ms | linear, infinite |
| Progress bar | Width transition | 500ms | spring |

### 9.5 Reduced Motion

Every animation respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Globe auto-spin is also disabled under reduced motion. This is not optional.

---

## 10. Accessibility Standards

### 10.1 Target Conformance

**WCAG 2.1 Level AA** — full compliance, no exceptions.

### 10.2 Color Contrast

| Pair | Required Ratio | Target |
|------|---------------|--------|
| Body text on background | 4.5:1 | 7:1+ |
| Large text on background | 3:1 | 4.5:1+ |
| UI components / icons | 3:1 | 4.5:1+ |
| Placeholder text | 4.5:1 | — |

All color pairs are documented in `tokens/colors.css` with their measured ratios.

### 10.3 Keyboard Navigation

Every action in the game is achievable without a mouse:

| Action | Keyboard Equivalent |
|--------|-------------------|
| Type country | Type in focused input (auto-focused) |
| Accept suggestion | Tab to suggestion button, Enter |
| Open instructions | Tab to ⓘ button, Enter |
| Close modal | Escape |
| Switch continent tab | Tab / Shift+Tab + Enter |
| Expand accordion row | Enter |
| Start new game | Tab to "New Game", Enter |

Tab order follows visual left-to-right, top-to-bottom order. No tab traps except within open modals (modal must trap focus).

### 10.4 Screen Reader Requirements

- `<main>` landmark wraps the game area
- All icon-only buttons have `aria-label`
- Timer updates use `aria-live="polite"` at a maximum of once per 10 seconds (not every second)
- Found count updates use `aria-live="polite"`
- Modal opens move focus to the modal heading; close returns focus to the trigger
- Globe is `role="img"` with `aria-label="Interactive globe showing country discovery progress"`
- Country chips that reveal use `aria-label="[Country name] — found"` vs `aria-label="Unknown country"`

### 10.5 Focus States

Focus rings are never hidden. The focus ring style:

```css
:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: 3px;
  border-radius: inherit;
}
```

`outline: none` is banned without `focus-visible` replacement.

---

## 11. Performance Budgets

### 11.1 Loading

| Metric | Budget | Target |
|--------|--------|--------|
| First Contentful Paint | < 1.5s | < 0.8s |
| Largest Contentful Paint | < 2.5s | < 1.5s |
| Time to Interactive | < 3.0s | < 2.0s |
| Total JS bundle (gzipped) | < 400KB | < 300KB |
| Initial CSS | < 20KB | < 10KB |

### 11.2 Runtime

| Metric | Budget |
|--------|--------|
| Globe frame rate | 60fps (≥55fps minimum) |
| Input response time | < 16ms (one frame) |
| Fuzzy match on Enter | < 50ms |
| Country fill update | < 32ms (two frames) |
| Cumulative Layout Shift | < 0.1 |

### 11.3 Memory

| Metric | Budget |
|--------|--------|
| JS heap at idle | < 80MB |
| JS heap during gameplay | < 150MB |
| No memory leaks | Zero detectable growth over a 30-minute session |

### 11.4 Enforcement

The Performance Engineer runs Lighthouse and Chrome DevTools profiling at:
- Every PR that touches the rendering pipeline
- Every release candidate
- After any dependency update

A PR that causes a regression beyond 10% of any budget is blocked until resolved.

---

## 12. Testing Methodology

### 12.1 Test Pyramid

```
          [E2E — Playwright]
         ~~~~~~~~~~~~~~~~~~~~
        [Integration — RTL]
       ~~~~~~~~~~~~~~~~~~~~~~~~~~
      [Unit — Vitest]
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

| Layer | Coverage Target | Tool |
|-------|----------------|------|
| Unit | 100% of game logic functions | Vitest |
| Integration | All user flows, all screens | React Testing Library |
| E2E | Critical paths only | Playwright |

### 12.2 What Must Be Unit Tested

Every function in `src/game/`:
- `normalize` — 20+ edge cases (diacritics, whitespace, case)
- `exactMatch` — all 197 countries + all aliases
- `fuzzyMatch` — valid 1-error cases, invalid 2-error cases, edge lengths
- `suggestMatch` — threshold behaviour, returns closest above 75%
- `formatTime` — boundary values (0, 59, 60, 3600, 5999)
- `checkMilestone` — all milestone counts, continent completion

### 12.3 What Must Be Integration Tested

- Full game loop: type → accept → state update → globe call
- Timer expiry triggers results screen
- Give up with confirmation guard
- Modal open/close with focus management
- Escape key behaviour per modal
- Share clipboard copy
- Keyboard-only playthrough of one full user flow

### 12.4 What Must Be E2E Tested

- App loads and globe renders
- Player can find a country (type, accept, badge appears)
- Timer counts down
- Results screen appears at time expiry
- "Play Again" resets state completely

### 12.5 Test Conventions

- Test descriptions are written as user-facing behaviour: `"shows a badge when a country is found"` not `"badge is truthy"`
- No tests that assert implementation details (no testing state variable names)
- Every bug fix includes a regression test before the fix

---

## 13. Documentation Requirements

### 13.1 Required Documents

| Document | Owner | When Updated |
|----------|-------|-------------|
| `00_MASTER_BLUEPRINT.md` | Staff Engineer | When any standard changes |
| `COTE_Spec.md` | Product Manager | When any feature changes |
| `CHANGELOG.md` | QA Lead | Every release |
| `README.md` | Staff Engineer | Every major milestone |
| Component JSDoc | Authoring engineer | When component ships |

### 13.2 Code Comment Standards

Comments explain **why**, never **what**. The code explains what.

```javascript
// ❌ What (obvious from code)
// Set guessed IDs to a new Set
const next = new Set(guessedRef.current);

// ✅ Why (non-obvious reasoning)
// Use a ref for guessedIds in addition to state so the animation
// loop can read the current value without stale closure issues
const guessedRef = useRef(new Set());
```

JSDoc is required for:
- All exported functions
- All custom hooks
- All components with non-obvious props

### 13.3 Decision Records

Any architectural decision that is non-obvious or that overturned a previous approach is recorded as an Architecture Decision Record (ADR) in a `/docs/adr/` folder:

```
docs/adr/
  001-three-js-over-d3-globe.md
  002-no-external-state-library.md
  003-css-modules-over-tailwind.md
```

Each ADR contains: Context, Decision, Consequences, Alternatives Considered.

---

## 14. Git Workflow

### 14.1 Branch Strategy

```
main          — always deployable; protected; requires PR + review
  └── feature/[description]    — new features
  └── fix/[description]        — bug fixes
  └── perf/[description]       — performance improvements
  └── chore/[description]      — maintenance, dependencies
  └── docs/[description]       — documentation only
```

Branch names are lowercase, hyphen-separated, descriptive:
```
feature/globe-country-rotation
fix/timer-double-fire-on-remount
perf/fuzzy-match-debounce
```

### 14.2 Commit Standards

Commits follow Conventional Commits:

```
type(scope): imperative description

feat(globe): animate rotation to found country centroid
fix(timer): prevent interval double-registration on strict mode
perf(matching): debounce fuzzy scan at 150ms
style(header): align timer pill spacing to 4px grid
test(matching): add edge cases for single-character inputs
docs(blueprint): add ADR template
chore(deps): update three.js to 0.163.0
```

**Types:** `feat`, `fix`, `perf`, `style`, `test`, `docs`, `chore`, `refactor`

No commit may include both feature work and refactoring. They are separate commits.

### 14.3 Pull Request Standards

Every PR requires:
- A description that explains *why* the change was made, not what
- Screenshots or screen recordings for any visual change
- Checklist confirmation: tests pass, accessibility checked, performance not regressed
- At least one reviewer approval
- All CI checks green

PR size limit: 400 lines changed. Larger PRs require prior agreement and must be split.

### 14.4 Protected Branch Rules

`main` requires:
- Linear history (no merge commits; squash or rebase)
- Status checks passing (lint, typecheck, unit tests, build)
- One approved review
- No force push, ever

---

## 15. Deployment Strategy

### 15.1 Hosting

GitHub Pages, deployed via GitHub Actions on every merge to `main`.

### 15.2 Build Configuration

```javascript
// vite.config.js
export default {
  base: '/cote/',
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: false, // production; true for staging
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],       // split Three.js into its own chunk
          react: ['react', 'react-dom'],
        }
      }
    }
  }
}
```

### 15.3 Release Process

1. All features for the release are merged to `main`
2. QA Lead runs the full test matrix
3. Performance Engineer runs Lighthouse audit
4. Accessibility Specialist runs manual keyboard and screen reader audit
5. QA Lead creates a release tag: `v1.2.0`
6. GitHub Actions deploys automatically on tag push
7. QA Lead verifies production deployment
8. CHANGELOG updated

### 15.4 Rollback

If a production issue is found: revert the merge commit to `main`. The previous commit deploys automatically. No hotfix branches unless the revert is not possible.

---

## 16. Security Principles

### 16.1 Data Handling

- No user data is collected without explicit consent
- No PII is stored in localStorage or sessionStorage
- Player names (for leaderboard) are the only user-provided data; treated as untrusted input, sanitised before display, never executed

### 16.2 Dependencies

- Dependencies are audited with `npm audit` before every release
- No dependency with a known high/critical vulnerability ships
- Dependencies are reviewed quarterly; unused dependencies are removed

### 16.3 Content Security Policy

The deployed application includes a strict CSP header:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self' https://cdn.jsdelivr.net;
```

No inline scripts. No `eval`. No `unsafe-inline`.

### 16.4 Third-Party Resources

The only external resources loaded at runtime:
- Google Fonts (Poppins)
- TopoJSON parser (CDN, pinned version, integrity hash)
- World Atlas GeoJSON data (CDN, pinned version, integrity hash)

All CDN resources use `integrity` and `crossorigin` attributes.

---

## 17. Decision-Making Framework

### 17.1 When Facing a Design Decision

Ask in order:
1. Does the COTE Spec define this? → Follow it exactly.
2. Does this blueprint define the standard? → Apply it.
3. What would an Apple HIG-compliant product do? → Do that.
4. What produces the most maintainable outcome? → Choose it.
5. Escalate to the relevant role owner.

### 17.2 When Facing an Engineering Decision

Ask in order:
1. Does this make the code more or less readable?
2. Does this make the system more or less testable?
3. Does this introduce or remove a dependency?
4. Does this help or hurt performance?
5. Is this reversible? If not, apply extra scrutiny.

### 17.3 When There Is Disagreement

- Design disagreements: HI Designer has final say within their domain; PM has final say on scope
- Engineering disagreements: Staff Engineer has final say; decision is documented as an ADR
- Accessibility disagreements: Accessibility Specialist has veto power on shipping; no exceptions
- Performance disagreements: Performance Engineer has veto power on shipping if budgets are violated

### 17.4 When a Standard Needs to Change

A standard in this document may only be changed by:
1. Proposing the change in writing with justification
2. Review by all affected role owners
3. Consensus or Staff Engineer resolution
4. Updating this document before any implementation begins

No standard is changed by simply not following it.

---

## 18. Non-Negotiables

These rules are absolute. They cannot be overridden by timeline pressure, scope requests, or personal preference.

1. **The application is fully keyboard-navigable.** No exceptions.
2. **Color contrast meets WCAG AA.** No exceptions.
3. **All animations respect `prefers-reduced-motion`.** No exceptions.
4. **No feature ships without tests.** No exceptions.
5. **No commit contains both feature work and refactoring.** No exceptions.
6. **The globe module has no direct React imports.** No exceptions.
7. **No `console.log` in committed code.** No exceptions.
8. **No magic numbers — all constants are named.** No exceptions.
9. **Every PR has a reviewer.** No self-merges. No exceptions.
10. **Performance budgets are enforced before release.** No exceptions.

---

*This document was written to last. When in doubt, return to Section 1.*

*Version 1.0 — Established at project inception.*
*Next review: after v1.0 ships.*
