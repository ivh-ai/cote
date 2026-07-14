# 06 — GLOBE RENDERING SPECIFICATION
## COTE: Countries of the Earth
### Interactive Globe v1.0

> Source of truth: [00_MASTER_BLUEPRINT.md](00_MASTER_BLUEPRINT.md) §6, §11. Motion: [04_MOTION_SPECIFICATION.md](04_MOTION_SPECIFICATION.md). Colors: [03_DESIGN_SYSTEM.md](03_DESIGN_SYSTEM.md).
>
> **Two-track reality.** The current globe (`src/WorldCountriesGame.jsx`) is a **d3-geoOrthographic SVG** projection — a well-crafted 2.5D globe with layered radial-gradient lighting (ocean, atmosphere, terminator, specular, rim). The brief targets a **photorealistic React Three Fiber (WebGL)** globe. This document specifies the **target R3F pipeline** and documents the **existing SVG globe** as the shippable fallback / current state. The migration is staged so the game never loses a working globe.

---

## 1. Goals & Constraints

**Goal:** Apple-quality rendering + National Geographic realism — a photoreal Earth that feels physically present, at 60fps, degrading gracefully.

**Hard constraints (Blueprint §6.1, §11):**
- The globe is a self-contained module owning its canvas, renderer, scene, camera, and rAF loop.
- It exposes an imperative API and **never reads React state directly** — updates arrive through a ref bridge.
- It disposes all geometries/materials/textures on unmount (no leaks; Blueprint §11.3).
- 60fps target, ≥55fps floor; graceful degradation to 30fps and reduced quality rather than erratic drops.
- Respects `prefers-reduced-motion` (no auto-spin, no ambient drift).
- Never steals focus from the text input (FR-GLOBE-5).

---

## 2. Recommended Stack

| Concern | Recommendation | Rationale |
|---------|---------------|-----------|
| Renderer | **Three.js** via **React Three Fiber (R3F)** | Declarative scene, plays well with React lifecycle while keeping the loop outside React reconciliation |
| Helpers | **@react-three/drei** (selectively) | `OrbitControls`, `Stars`, loaders — tree-shaken |
| Post-processing | **@react-three/postprocessing** (optional) | Subtle bloom on atmosphere/celebration only |
| Geometry data | **Natural Earth** 110m (current) + 50m (zoom LOD) via world-atlas TopoJSON | Already used; well-formed |
| Projection→3D | Convert lon/lat to sphere positions; extrude/triangulate country polygons onto the sphere | See §9 |
| Animation | R3F `useFrame` loop + imperative tweens | Loop decoupled from React |

**Fallback:** keep the existing d3-SVG globe behind a capability check (no WebGL / low-power / reduced-motion-preferring-static) so every user gets a globe.

---

## 3. Rendering Pipeline

```
Load textures + geo data (async, with loading state)
   → Build scene: camera, lights, Earth sphere, atmosphere, clouds, stars
   → Triangulate country meshes onto the sphere (or use a data-texture mask)
   → useFrame loop:
        update rotation (auto-spin | drag | rotate-to)
        update camera zoom (lerp)
        update per-country material state (found/highlight/missed) from ref bridge
        render
   → Dispose on unmount
```

The country **state** (found/missed/highlight) flows in via `globeApi.updateCountries(foundIdSet, { gameState })` — a single batched call per change (Blueprint §6.3), not per-country.

---

## 4. React Three Fiber Architecture

Target `src/globe/`:

| File | Responsibility |
|------|----------------|
| `GlobeCanvas.jsx` | R3F `<Canvas>` host; the only React↔globe seam; exposes a ref API |
| `useGlobe.js` | Hook returning `{ ref, api }`; bridges game state → imperative calls |
| `scene/Earth.jsx` | Sphere mesh, day/normal/specular materials |
| `scene/Atmosphere.jsx` | Fresnel rim shader |
| `scene/Clouds.jsx` | Semi-transparent cloud sphere (optional/LOD) |
| `scene/Stars.jsx` | Background starfield |
| `scene/Countries.jsx` | Country meshes + fill/highlight/missed materials |
| `controls/GlobeControls.js` | Drag-rotate, zoom, auto-spin, rotate-to |
| `materials/*.js` | Shader materials (ocean, atmosphere, country) |
| `data/geo.js` | TopoJSON→sphere geometry, centroids, LOD |
| `data/topoColors.js` | The biome `TOPO_COLOR` map (from existing) |

**The bridge (critical):** `Countries.jsx` reads found/missed state from a `useRef`, updated by `useGlobe` via `api.updateCountries(...)`. React never re-renders the scene on a guess — the material update happens inside `useFrame` or an imperative setter. This is the Blueprint §6.1 non-negotiable ("globe module has no direct React imports beyond its bridge").

---

## 5. Camera

- **Perspective camera**, FOV ~35–45° for a natural, slightly telephoto look (less distortion, more "premium").
- Positioned on +Z looking at origin; globe radius normalized to 1.
- **Zoom** = dolly (move camera along view axis) or FOV tween, clamped `[minZoom, maxZoom]` (existing SVG uses scale 246→738, a 3× zoom; mirror that range).
- Zoom lerps toward target (existing pattern: `current += (target-current)*0.07`).
- Double-click to zoom to a point (existing behavior): raycast to the sphere, rotate that point to face camera, then dolly in; double-click again resets.
- Reduced-motion: instant zoom, no lerp animation.

---

## 6. Lighting

Match the existing SVG's "lit from upper-left, terminator lower-right" look, now physically:

- **Key light:** directional "sun," warm-white, from upper-left; drives the day/night terminator.
- **Ambient/fill:** low, cool, so the dark side isn't pure black but reads as Earthshine.
- **Specular:** the ocean material has higher specularity than land, producing the bright glint on the lit side (existing `#specular` gradient, now real).
- Optional **rim/back light** to separate the globe from the void (existing `#rim` darkening → a subtle Fresnel rim instead).
- No moving lights during play (stable, cinematic); the Perfect celebration may sweep a highlight (doc 04 §3.17).

---

## 7. Atmosphere

- **Fresnel shell:** a slightly larger sphere with an additive Fresnel shader — brightest at the limb, transparent at center — giving the blue halo (existing `#atmos` at 88–100% radius, now volumetric-looking).
- Color: oceanic blue-white (`--ocean-300`/white blend).
- Subtle, never neon; intensity tied to view angle.
- Reduced-motion: static (no shimmer/pulse).

---

## 8. Ocean Shader

- Base color: deep ocean gradient (existing `#oceanDepth`: `#2a6898 → #0e3860 → #040d20`), lit from upper-left.
- Higher specular than land for the sun glint.
- Optional low-amplitude normal-map ripple for life — **off by default** to protect the frame budget; enabled only on capable GPUs (LOD tier, §18).
- Reduced-motion / low-power: flat lit gradient (visually equivalent to the current SVG ocean).

---

## 9. Country Geometry

**Approach A (meshes):** Triangulate each country polygon (from 110m TopoJSON) and project vertices onto the sphere (lon/lat → xyz at radius slightly above the ocean sphere to avoid z-fighting). Each country is its own mesh/`BufferGeometry` for independent material state.
- Pros: crisp per-country fills, easy highlight/pulse.
- Cons: triangulation cost at load; ~197 draw calls (merge unfound into one instanced/merged mesh; keep found ones addressable).

**Approach B (data-texture mask):** Bake a country-id mask texture; a fragment shader colors each pixel by looking up per-id state from a small state texture. One draw call, GPU-side state.
- Pros: 1 draw call, trivial to animate all countries.
- Cons: border crispness depends on mask resolution; more shader complexity.

**Recommendation:** **Approach A with merging** for v1.0 (simpler, crisp borders, aligns with the existing per-feature model), revisit B if draw calls hurt. Precompute **centroids** for rotate-to and label anchoring (§13).

Geometry is built **once** at load and cached (Blueprint §6.4).

---

## 10. Country Borders

- Thin border lines between countries (existing SVG stroke `#4a5a4a`, 0.8). In WebGL: render polygon outlines as line geometry slightly above fills, or a border color baked into the mask.
- Borders subtle so found-fills read as the primary signal; slightly brighter on the lit hemisphere via lighting.
- At zoom, borders use the 50m dataset (LOD, §18) for crispness.

---

## 11. Country Fill Animation

- Unfound: neutral land (existing `--landDark #4a5568`).
- On found: tween the material color from land → biome color over 300ms ease-out (doc 04 §3.7), plus a one-shot highlight pulse (§12).
- Batched: `updateCountries(foundSet)` diffs against the previous set and animates only the newly-added ids.
- Reduced-motion: instant color swap, no pulse.

Biome palette (`TOPO_COLOR`, retained from existing — 9 biomes): tropicalForest `#2e7a40`, temperate `#4e9040`, mediterranean `#7aaa38`, savanna `#98b828`, steppe `#c4b018`, desert `#cc9820`, mountain `#9a6a30`, tundra `#5a8888`, island `#309858`. Every country id is pre-mapped.

---

## 12. Country Highlight Effects

- **Reveal pulse:** an expanding ring/glow at the country centroid, `scale 0.9→1.15` + fade over 300ms (doc 04 §3.7). In WebGL: a shader ring on the sphere tangent plane, or an emissive flash on the country material.
- **Last-found emphasis:** the most recent country stays slightly brighter for ~1.5s then eases back (doc 04 §3.8).
- Effects are pooled/reused to avoid per-guess allocation.

---

## 13. Missed Country Rendering

- At `finished` with misses: unfound countries fill dark red (existing `#4a1010` fill, `#7f1d1d` stroke) — a distinct "missed" state.
- Optional: gently rotate the globe through the largest clusters of missed countries at reveal (doc 04 §3.9), reduced-motion-gated.
- Found countries retain biome color; the contrast tells the story at a glance.

---

## 14. Rotation Logic

- **Auto-spin:** slow continuous yaw (~0.03°/frame, existing) when idle and not zoomed; disabled under reduced-motion.
- **User drag:** overrides auto-spin; resumes after release/idle.
- **rotate-to(lon,lat):** lerps current rotation toward the target so a country faces the camera (existing zoom-centering lerp at 0.06/frame).
- Latitude clamp ±85° (existing) to avoid gimbal flip at the poles.

---

## 15. Drag Physics

- Pointer down → capture start; pointer move → apply delta × sensitivity to yaw/pitch.
- Sensitivity lower when zoomed (existing: 0.35 normal, 0.175 zoomed) for precision.
- **Optional inertia:** continue spin briefly after release, decaying ~600ms (doc 04 §3.16); off under reduced-motion.
- Pointer events (not mouse-only) for trackpad/pen; must not block system gestures; must not focus-steal.
- **A11y addition (doc 02 §16):** arrow-key rotation when the globe control is focused — the current drag model is not keyboard-reachable and must be supplemented.

---

## 16. Zoom Behavior

- Double-click zooms to point (3× existing); double-click again resets (existing).
- Scroll/pinch zoom (target addition) with clamped range and lerp.
- While zoomed: auto-spin off, drag sensitivity reduced.
- Reduced-motion: instant zoom steps.

---

## 17. Performance Optimization

- **Loop outside React:** all per-frame work in `useFrame`; React never re-renders on rotation or guesses.
- **Skip-if-unchanged:** only recompute/redraw when rotation/scale/state changed beyond a threshold (existing SVG does exactly this — `r0/r1/sc` rounding gate; keep the idea).
- **Merge unfound countries** into one geometry; keep found ones addressable; instance where possible.
- **Frame budget:** ≤16ms; heavy work (triangulation, texture decode) off the critical path, behind the loading state.
- **fps-adaptive quality:** monitor frame time; if sustained >18ms, drop cloud layer / ocean ripple / lower texture LOD before dropping animation frames (degrade to 30fps target).
- **Pause when hidden:** stop the loop on `document.hidden`/`IntersectionObserver` to save battery.
- **Dispose everything** on unmount.

Targets (Blueprint §11.2): ≥55fps globe, country fill update <32ms, JS heap during gameplay <150MB, zero leak over 30 min.

---

## 18. Asset Pipeline, Texture Strategy & LOD

**Textures (target photoreal):**
- Day color map, normal/bump map, specular/roughness (ocean mask), optional night-lights, optional cloud map.
- Served as compressed **WebP/AVIF** or GPU-compressed **KTX2/Basis** where supported; sized to the largest realistic display (e.g., 4k day map split or 2k for the base tier).
- `font-display`-equivalent: show the loading globe (existing "Loading map…") until the base tier is ready; progressively upgrade texture resolution.

**Geometry LOD:**
- 110m TopoJSON at default zoom (existing); swap to 50m when zoomed in for crisp small countries/borders.
- Simplify micro-states' geometry but keep them selectable (many are islands already colored `#309858`).

**Delivery:**
- Assets pinned + integrity-hashed if from CDN (Blueprint §16); prefer self-hosting large textures for CSP simplicity and cache control.
- Manual chunk: Three.js/R3F in their own bundle chunk (Blueprint §15.2, §11.1).

**Capability tiers:**
| Tier | Trigger | Quality |
|------|---------|---------|
| High | Discrete GPU, good frame times | Clouds, ocean ripple, 2k+ textures, bloom on celebration |
| Medium | Default | No ripple, clouds optional, 1–2k textures |
| Low | Integrated GPU / slow frames | No clouds, flat ocean, 1k textures, no bloom |
| Fallback | No WebGL / reduced-motion static | **d3-SVG globe** (existing), static under reduced-motion |

---

## 19. Migration Plan (SVG → R3F)

1. **Extract** the existing SVG globe into `globe/legacy/` behind the imperative API (`highlightCountry`, `updateCountries`, `rotateTo`, `setZoom`, `dispose`). No visual change; establishes the seam.
2. **Introduce** `GlobeCanvas` (R3F) implementing the same API; feature-flag which renderer mounts.
3. Build Earth + atmosphere + stars + lit ocean to visual parity with the SVG, then surpass (textures, clouds).
4. Port country fills/borders/reveal/missed to WebGL; verify batched `updateCountries`.
5. Add zoom/drag/rotate-to + keyboard rotation + capability tiers.
6. QA against fps/heap budgets; keep SVG as the fallback tier permanently.

Each step is a milestone with its own verification (Blueprint incremental delivery).

---

*Owned by the Three.js Graphics Engineer; no other engineer merges globe internals without review (Blueprint §3.1). Version 1.0.*
