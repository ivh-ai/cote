# Contributing to COTE

Thanks for your interest. COTE holds itself to an unusually high bar — it is documentation-driven, and every change references [00_MASTER_BLUEPRINT.md](00_MASTER_BLUEPRINT.md), the project's constitution. Please read the Blueprint before your first contribution; it defines the standards this guide only summarizes.

---

## Philosophy in one line

> When there are multiple valid solutions, prioritize maintainability, scalability, accessibility, and a premium user experience over short-term simplicity.

---

## Getting set up

```bash
npm install
npm run dev
```

Before pushing, all of these must pass:

```bash
npm run typecheck   # strict TS, zero errors
npm test            # all unit tests green
npm run build       # production build succeeds
npm run lint        # no new warnings
```

---

## Architecture rules (enforced, not suggested)

The codebase has three domains with **strict import boundaries** (Blueprint §5.4):

```
game/    pure logic — no React, no DOM, no Three.js
globe/   React Three Fiber — no game-logic imports (state arrives via the ref bridge)
ui/      React components — may import game/ and globe/; they never import ui/
services/ side effects (storage, network) — imported by ui/hooks, never by game/
```

Crossing a boundary requires a documented justification. The globe never re-renders on a guess — it is controlled imperatively through `GlobeCanvas`'s ref API.

---

## Code standards (Blueprint §5)

- **TypeScript strict.** No `any` in app code.
- **No magic numbers** — name every constant (`BADGE_MS`, `TIMER_MODES`, …).
- **No `console.log`** in committed code — use a dev-gated logger.
- **Comments explain *why*, not *what*.**
- **Component/file size limits:** component ≤ 200 lines, hook ≤ 150, function ≤ 40, JSX depth ≤ 5. Exceeding requires a documented refactor plan.
- **All interactive components define every state:** default, hover, active, focus-visible, disabled, loading, error (Design System §20).
- **Pure game logic is 100% unit-tested** — add tests with any change to `game/`.

---

## Accessibility (non-negotiable — Blueprint §18)

Every contribution must preserve:

1. Full keyboard operability (tab order, focus traps in modals, Escape to retreat).
2. WCAG 2.1 AA contrast — document measured ratios for any new colour pair.
3. `prefers-reduced-motion` respected, including globe motion.
4. No information conveyed by colour alone.
5. Visible focus states — never `outline: none` without a `:focus-visible` replacement.

A feature that breaks any of these does not ship.

---

## Testing (Blueprint §12)

| Layer | Tool | Requirement |
|-------|------|-------------|
| Unit | Vitest | 100% of `game/` pure logic |
| Integration | React Testing Library | user flows, focus management *(to be added)* |
| E2E | Playwright | critical paths *(to be added)* |

- Write test descriptions as user-facing behaviour ("accepts a single-character typo"), not implementation ("editDistance returns 1").
- Every bug fix includes a regression test **before** the fix.

---

## Git workflow (Blueprint §14)

**Branches:** `feature/…`, `fix/…`, `perf/…`, `chore/…`, `docs/…` (lowercase, hyphenated, descriptive).

**Commits — Conventional Commits:**

```
feat(globe): animate country reveal on the sphere
fix(timer): prevent interval double-registration on strict-mode remount
test(matching): add diacritic-folding edge cases
docs(qa): record known WebGL context-exhaustion caveat
```

No commit mixes feature work and refactoring — they are separate commits.

**Pull requests** need: a description of *why*, screenshots/recordings for visual changes, passing CI (typecheck/lint/test/build), and one review. PRs are capped at ~400 lines changed; split larger ones.

---

## Changing a standard

A Blueprint standard changes only by (1) proposing it in writing with justification, (2) review by affected owners, (3) updating the Blueprint **before** implementation. No standard is changed by simply not following it (Blueprint §17.4). Non-obvious decisions are recorded as ADRs in `docs/adr/`.

---

## Where to start

Good first contributions are in the P1/P2 lists of [09_QA_REPORT.md](09_QA_REPORT.md) — e.g. adding integration tests, keyboard globe rotation, a WebGL context-loss handler, or the reduced-motion verification pass.
