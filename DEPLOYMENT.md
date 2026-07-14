# Deployment

COTE is a static single-page app. It builds to `dist/` and is served as static files — no server runtime required. The reference deployment is **Vercel** (root-domain, `vercel.json` at the repo root).

---

## 1. Build

```bash
npm ci
npm run build     # → dist/
```

Key build facts:
- **Base path is `/`** (`vite.config.ts`) for a root-domain deploy (Vercel). If you deploy under a subpath, change `base` to `/<subpath>/`, or asset URLs will 404. The map data URL uses `import.meta.env.BASE_URL`, so it adapts automatically.
- Output is chunked: `three` (R3F/Three.js), `react`, and the app are separate chunks (~314 KB gzipped total — within the < 400 KB budget).
- Geo data is self-hosted at `public/data/countries-110m.json` and copied to `dist/data/` — no runtime CDN dependency for the map.

Preview the production build locally:

```bash
npm run preview
```

---

## 2. Vercel (reference deployment)

`vercel.json` at the repo root configures the Vite build and an SPA rewrite:

```json
{ "framework": "vite", "buildCommand": "npm run build", "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**One-time setup (done in your Vercel account — not by CI):**
1. Vercel → **Add New… → Project → Import** the `ivh-ai/cote` GitHub repo.
2. Framework preset auto-detects **Vite**; build `npm run build`, output `dist` (matches `vercel.json`).
3. Deploy. Every push to `main` then auto-deploys; PRs get preview deployments.

No Supabase env vars are required in Vercel — the anon URL/key are public and embedded in the client (all write safety is in the database, §4). If you later move them to build-time vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`), set them in Vercel → Project → Settings → Environment Variables.

Quality gates run in CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) on every push/PR (typecheck + lint + test + build).

---

## 3. Alternative hosts

Any static host works (Netlify, Vercel static, Cloudflare Pages, S3+CloudFront):
- Build command: `npm run build`, publish directory: `dist`.
- **Set `base` correctly.** For a root domain (`example.com`), use `base: '/'`. For a subpath, match it.
- Configure an SPA fallback only if you add client routing later (v1 is single-surface; not required now).

---

## 4. Supabase backend

The leaderboard uses Supabase. The anon URL and key are embedded in the client (`src/services/leaderboard.ts`) — this is expected; **the anon key is public by design and all write safety lives in the database** (Blueprint §16, [08_SUPABASE_SCHEMA.md](08_SUPABASE_SCHEMA.md)).

### Current state
**The migrations are applied and verified live** (`supabase/migrations/0001–0004`): the `leaderboard` table, RLS (public read, no direct writes), and the `submit_score` anti-cheat RPC exist, with 7 rows backfilled from the legacy `COTE` table. The client (`services/leaderboard.ts`) uses the RPC path. Anti-cheat was verified rejecting an implausible score.

> Note: a prior effort also added a `submit-score` **Edge Function** on the same project (a different approach to the same goal). The rebuild uses the RPC; the Edge Function is now unused and can be removed at your discretion.

### Migration reference
The applied migrations (from [08_SUPABASE_SCHEMA.md](08_SUPABASE_SCHEMA.md) §5–§9) create:
- the `leaderboard` table + indexes,
- Row Level Security (read-only for anon; **no** direct writes),
- the `submit_score` **security-definer RPC** (server-computed score, range + plausibility anti-cheat, atomic best-per-name upsert),
- (recommended) an Edge Function for per-IP rate limiting.

Once the RPC exists, the client automatically upgrades to it — `services/leaderboard.ts` tries the RPC first and only falls back to REST on a 404. **No client change is needed** when the migration lands.

To point at a different Supabase project, update `SUPABASE_URL` / `SUPABASE_KEY` in `src/services/leaderboard.ts`. (Consider moving these to build-time env vars — `import.meta.env.VITE_SUPABASE_*` — for multi-environment deploys.)

---

## 5. Security headers (recommended)

GitHub Pages does not support custom headers. For a production launch on a host that does, add a strict Content-Security-Policy (Blueprint §16.3, doc 07 §8):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self' https://<project>.supabase.co;
```

Self-hosting the Poppins font (currently loaded from Google Fonts) lets you drop the font origins entirely.

---

## 6. Rollback

Because deploys are driven by `main`, rollback = revert the offending merge commit; the previous commit rebuilds and redeploys automatically (Blueprint §15.4). Avoid hotfix branches unless a revert is impossible.

---

## 7. Pre-deploy checklist

- [x] `npm run typecheck`, `npm test`, `npm run build` all green
- [x] `base` matches the deploy path (`/` for Vercel root domain)
- [x] Supabase migrations applied (anti-cheat live) — see §4
- [x] Lighthouse: performance 99, accessibility 100 (desktop) — QA §5
- [x] Legacy `WorldCountriesGame.jsx` removed (QA §14)
- [x] Error boundary present (QA §10)
- [ ] Vercel project imported + connected to the repo (your account)
- [ ] `LICENSE` added
