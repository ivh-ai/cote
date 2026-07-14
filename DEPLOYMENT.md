# Deployment

COTE is a static single-page app. It builds to `dist/` and is served as static files — no server runtime required. The reference deployment is **GitHub Pages**, automated via GitHub Actions.

---

## 1. Build

```bash
npm ci
npm run build     # → dist/
```

Key build facts:
- **Base path is `/cote/`** (`vite.config.ts`). If you deploy to a different path or a root domain, change `base` accordingly, or asset URLs will 404.
- Output is chunked: `three` (R3F/Three.js), `react`, and the app are separate chunks (~314 KB gzipped total — within the < 400 KB budget).
- Geo data is self-hosted at `public/data/countries-110m.json` and copied to `dist/data/` — no runtime CDN dependency for the map.

Preview the production build locally:

```bash
npm run preview
```

---

## 2. GitHub Pages (automated)

A workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) deploys on every push to `main`:

1. Checkout → setup Node 20 → `npm ci`
2. `npm run build`
3. Upload `dist/` as a Pages artifact → `actions/deploy-pages`

**One-time setup:**
1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Ensure the repository name matches the `base` (`/cote/`) — i.e. the site serves at `https://<user>.github.io/cote/`. If your repo has a different name, update `base` in `vite.config.ts` to `/<repo-name>/`.
3. Push to `main`. The Action builds and publishes; the environment URL appears in the Actions run.

**Recommended hardening (not yet in the workflow):** add `npm run typecheck`, `npm test`, and `npm run lint` as steps *before* `npm run build` so a broken build never deploys (Blueprint §14.4 CI gates).

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
The client currently talks to a legacy `COTE` table via REST. This works but is **not cheat-resistant** (client-computed score, read-modify-write race).

### Required before public launch (P0 in [09_QA_REPORT.md](09_QA_REPORT.md))
Apply the migrations from [08_SUPABASE_SCHEMA.md](08_SUPABASE_SCHEMA.md) §5–§9 to create:
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

- [ ] `npm run typecheck`, `npm test`, `npm run build` all green
- [ ] `base` matches the deploy path
- [ ] Supabase migrations applied (anti-cheat live) — see §4
- [ ] Lighthouse: performance ≥ 90, accessibility = 100 (Blueprint §11)
- [ ] Legacy `WorldCountriesGame.jsx` removed (QA §14)
- [ ] Error boundary present (QA §10)
- [ ] `LICENSE` added
