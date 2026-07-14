# 04 — MOTION SPECIFICATION
## COTE: Countries of the Earth
### Motion Language v1.0

> Source of truth: [00_MASTER_BLUEPRINT.md](00_MASTER_BLUEPRINT.md) §9. Design tokens: [03_DESIGN_SYSTEM.md](03_DESIGN_SYSTEM.md) §19. Screen structure: [02_INFORMATION_ARCHITECTURE.md](02_INFORMATION_ARCHITECTURE.md).

---

## 1. Motion Philosophy

Motion in COTE feels like an **Apple keynote**: confident, unhurried, physically believable, and always in service of meaning. Every animation does exactly one of three jobs (Blueprint §9.1):

1. **Orient** — show where you are in space.
2. **Confirm** — acknowledge an action succeeded.
3. **Delight** — reward attention at earned moments (rare, proportional).

If an animation does none of these, it is removed. Motion is never decorative.

**Global rules:**
- Animate `transform` and `opacity` only (Blueprint §11).
- Exit ≈ 60–70% of enter duration (feels responsive).
- Motion is interruptible — user input cancels in-progress animation immediately.
- Everything respects `prefers-reduced-motion` (state changes become instant; globe auto-spin stops; celebrations become a static "hero frame").
- One-to-two key elements animate per view; no everything-at-once.

**Token vocabulary** (from Design System §19): `--dur-micro` 100 · `--dur-fast` 200 · `--dur-standard` 300 · `--dur-expressive` 500; easings `--ease-out`, `--ease-in`, `--ease-in-out`, `--ease-spring`.

---

## 2. Duration & Easing Master Table

| Name | Duration | Easing | Use |
|------|----------|--------|-----|
| instant | 0ms | — | Reduced-motion, or where motion feels sluggish |
| micro | 100ms | ease-out | Button press, hover |
| fast | 200ms | spring/ease-out | Badge, input feedback, tab switch |
| standard | 300ms | ease-in-out / spring | Modal, page/surface crossfade |
| expressive | 500ms | spring | Progress bar, globe rotate-to-country |
| globe | 400–600ms | ease-in-out | Zoom transitions |
| cinematic | 800–1600ms | custom | Intro, Perfect celebration (delight only) |

---

## 3. Per-Animation Specifications

Each entry: **Purpose · Timing · Easing · Description · Implementation · Reduced-motion.**

### 3.1 Intro Cinematic (globe entrance)
- **Purpose:** Delight/orient — establish the planet as the hero on first paint.
- **Timing:** 1200ms total; globe scale `1.08→1.0` + fade `0→1` (0–900ms), atmosphere/vignette settle (300–1200ms).
- **Easing:** custom ease-out (`cubic-bezier(0.16,1,0.3,1)`).
- **Description:** The Earth eases in from slightly zoomed-out as the void darkens around it; stars/atmosphere resolve last.
- **Implementation:** Framer Motion on the globe container (opacity/scale); the R3F scene fades its own exposure. One-time per load, not per navigation.
- **Reduced-motion:** globe appears at final state, opacity fade ≤ 200ms, no scale.

### 3.2 Welcome Experience
- **Purpose:** Orient — invite play.
- **Timing:** Staggered rise: wordmark (0ms), descriptor (+60ms), mode selector (+120ms), Start (+180ms); each `y:12→0` + fade over 300ms.
- **Easing:** ease-out; stagger 60ms.
- **Implementation:** Framer Motion `staggerChildren`.
- **Reduced-motion:** all appear together, fade only.

### 3.3 Navigation / Surface Transitions
- **Purpose:** Orient — moving between Welcome ↔ Game ↔ Results.
- **Timing:** 300ms crossfade; outgoing fades/`scale 1→0.99`, incoming fades/`scale 1.01→1`. Globe persists (never transitions).
- **Easing:** ease-in-out.
- **Implementation:** `AnimatePresence` on the active-surface layer; globe canvas outside the presence tree.
- **Reduced-motion:** instant swap, 150ms opacity only.

### 3.4 Page / Modal Transitions
- **Purpose:** Orient — layer pushes forward.
- **Timing:** Enter 220ms (`scale 0.96→1` + fade + `y 8→0`); exit 150ms (`scale 1→0.96` + fade).
- **Easing:** enter spring, exit ease-in.
- **Description:** Modal scales up from its trigger's direction; backdrop blur ramps `0→16px` and dim `0→0.55` over the same 220ms.
- **Implementation:** existing `cote-modal-in` keyframe → Framer Motion variants; add exit. Modal animates from trigger source where feasible (Blueprint modal-motion).
- **Reduced-motion:** fade only, 150ms; no scale; blur applied instantly.

### 3.5 Globe Entrance (in-game)
- Covered by Intro (3.1) on first load; on Play Again the globe does **not** re-intro — only the found-fills clear (see 3.7 reverse).

### 3.6 Globe Rotation (idle auto-spin)
- **Purpose:** Delight/ambient — a living planet.
- **Timing:** continuous, ~0.03°/frame (retained from existing) ≈ very slow; pauses on user drag, resumes after idle.
- **Easing:** linear (continuous loop — the one allowed linear use).
- **Implementation:** rAF loop in the globe module; decoupled from React (Blueprint §6.1). Drag inertia optional (see 3.16).
- **Reduced-motion:** auto-spin disabled entirely (Blueprint §9.5). User drag still allowed.

### 3.7 Country Reveal (correct answer)
- **Purpose:** Confirm — the signature moment.
- **Timing:** 300ms. Fill transitions land-gray → biome color (opacity/cross-tint); a highlight pulse ring expands `scale 0.9→1.15` + fade over 300ms.
- **Easing:** ease-out.
- **Description:** The named country warms into its biome color and emits a single soft pulse; if off-screen, the globe eases to rotate it into view (see 3.9) — but never yanks focus.
- **Implementation:** per-country material tween in the globe module via `updateCountries(foundIds)` batched call (Blueprint §6.3); pulse as a shader/overlay ring. Existing `cote-pulse-green` is the SVG-era analog — reimplemented in the R3F pipeline ([06](06_GLOBE_RENDERING_SPEC.md)).
- **Reduced-motion:** fill changes instantly; no pulse; no auto-rotate-to.

### 3.8 Country Highlight (hover/last-found emphasis)
- **Purpose:** Confirm — the most recent find stays gently lit for a beat.
- **Timing:** brief brighten over 200ms, holds ~1.5s, eases back 300ms.
- **Easing:** ease-out in, ease-in out.
- **Reduced-motion:** static brighten, no fade.

### 3.9 Globe Rotate-to-Country (optional assist)
- **Purpose:** Orient — bring a just-found or missed country into view.
- **Timing:** 500ms expressive ease toward the country centroid; skipped if already visible.
- **Easing:** spring (no overshoot past 3%).
- **Implementation:** `rotateTo(lon,lat)` imperative API; lerp current→target rotation (existing zoom-centering lerp at 0.06 is the pattern).
- **Reduced-motion:** disabled (jump only if strictly necessary, e.g., missed-reveal framing).

### 3.10 Dashboard Animations (counters, progress)
- **Purpose:** Confirm — progress is felt.
- **Timing:** Found counter ticks with a 150ms number roll; progress bar width 500ms spring; continent row bar 400ms spring.
- **Easing:** spring.
- **Implementation:** animate width via `transform: scaleX` (not `width`) to stay on the GPU; counter via a lightweight tween.
- **Reduced-motion:** number/bar update instantly.

### 3.11 Button Hover / Press
- **Purpose:** Confirm affordance.
- **Timing:** hover 150ms (bg/border), press `scale(0.97)` 100ms.
- **Easing:** ease-out.
- **Implementation:** CSS (existing `.cote-btn` transitions endorsed).
- **Reduced-motion:** color change only, no scale.

### 3.12 Input Animations
- **Purpose:** Confirm/guide.
- **Timing:** focus glow 150ms; error shake 350ms (`cote-shake`); suggestion slide-in 200ms.
- **Easing:** focus ease-out; shake custom `cubic-bezier(.36,.07,.19,.97)`.
- **Description:** On invalid Enter, the field shakes horizontally once and border flushes terracotta, paired with a text message (never color/motion alone).
- **Implementation:** existing `.cote-input-shake` + `cote-shake` keyframe, retuned to terracotta.
- **Reduced-motion:** shake replaced by a 1-frame border flash + text; suggestion appears without slide.

### 3.13 Achievement Unlock
- **Purpose:** Delight — earned.
- **Timing:** medallion springs in `scale 0.8→1` + fade over 260ms, brass ring sweeps (a rotating conic mask) 500ms, holds ~2s, exits 150ms.
- **Easing:** spring in, ease-in out.
- **Description:** Compact medallion drops from top-center with a soft brass shimmer; non-blocking, does not interrupt input.
- **Implementation:** Framer Motion toast layer (z-20); queue if multiple unlock at once (stagger 300ms).
- **Reduced-motion:** fade in/out only, no ring sweep, no drop.

### 3.14 Leaderboard Animations
- **Purpose:** Orient/confirm.
- **Timing:** rows stagger in 30–40ms each on open; own row highlights with a 400ms brass glow after submit.
- **Easing:** ease-out.
- **Implementation:** `staggerChildren` on the list; skeleton rows during load crossfade to real rows.
- **Reduced-motion:** rows appear together; highlight is a static brass background.

### 3.15 Background & Ambient Effects
- **Purpose:** Delight — a calm, living void.
- **Timing:** very slow star parallax / faint drift (≥ 20s cycles); atmosphere shimmer subtle.
- **Easing:** linear/loop.
- **Implementation:** in the globe scene (stars layer), extremely low amplitude; must respect the 16ms frame budget.
- **Reduced-motion:** static starfield, no drift/parallax (Blueprint parallax-subtle).

### 3.16 Micro-interactions
- Tab switch: 150ms indicator slide + color.
- Continent row expand: 250ms height/opacity (measured, no jump/CLS).
- Chip appear (found country in panel): 200ms fade + `y 4→0`, staggered when several land at once.
- Drag inertia (optional): globe continues briefly after release, decaying over ~600ms.
- Copy-to-clipboard: button label swaps to "Copied ✓" with a 150ms cross-fade, reverts after 1.5s.
- **Reduced-motion:** all become instant state changes.

### 3.17 Completion Celebration (Perfect — 197/197)
- **Purpose:** Delight — the single biggest moment in the product; must feel earned and memorable.
- **Timing:** ~1600ms cinematic sequence:
  1. Globe eases to a slow, full, showcase rotation as **all** countries finish warming to biome color (0–600ms).
  2. A brass light-sweep passes across the globe rim (400–1000ms).
  3. "Perfect. 197 / 197." rises and settles, tabular, with elapsed time (800–1400ms).
  4. Achievements earned this run cascade in (1200–1600ms).
- **Easing:** spring/custom cinematic.
- **Description:** Restrained, not confetti-spam — a keynote "one more thing" moment. Proportional to a genuinely rare achievement.
- **Implementation:** dedicated Perfect surface (IA S5); orchestrated Framer Motion timeline + globe showcase mode. No sound in v1.0.
- **Reduced-motion:** static "Perfect. 197/197." hero frame with the fully-colored globe; no sweeps or cascades.

---

## 4. Orchestration & Sequencing

- **Enter faster than you think, exit faster still.** Never make the user wait on motion to act — all animations are interruptible.
- **Stagger** for lists (30–50ms) and multi-element reveals; **never** stagger the critical input path.
- **Queue** transient toasts/badges (found → milestone → achievement) so they don't overlap; max one visible at a time, 300ms gap.
- **Spatial continuity:** forward = scale-up/rise; back = scale-down/settle. Modals grow from their trigger.

---

## 5. Performance Guardrails

- 60fps target; degrade the *globe* quality before dropping UI animation frames ([06](06_GLOBE_RENDERING_SPEC.md) LOD).
- Only `transform`/`opacity`; no animating `width`/`height`/`top`/`left`/`box-shadow`.
- `will-change` used surgically on actively-animating elements, removed after.
- No layout-triggering animation (no CLS from motion).
- Reduced-motion is a first-class code path tested in QA ([09](09_QA_REPORT.md)), not an afterthought.

---

## 6. Reduced-Motion Summary

| Animation | Reduced-motion behavior |
|-----------|-------------------------|
| Intro / Welcome | Fade only, ≤200ms, no scale/stagger |
| Surface/modal | Fade only, no scale; blur instant |
| Globe auto-spin | **Off** |
| Country reveal | Instant fill, no pulse, no rotate-to |
| Counters/progress | Instant update |
| Buttons/inputs | Color change only; error = flash + text |
| Achievement/Perfect | Static hero frame, no sweeps/cascades |
| Ambient/stars | Static |

---

*Motion is owned by the Motion Designer, implemented with the Senior Frontend Engineer. Nothing ships without a defined reduced-motion path. Version 1.0.*
