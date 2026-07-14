# Supabase migrations

These SQL migrations harden the leaderboard per [08_SUPABASE_SCHEMA.md](../08_SUPABASE_SCHEMA.md). They are **authored and ready to apply** — applying them requires access to the COTE Supabase project, which is done by the project owner.

| File | Purpose |
|------|---------|
| `0001_create_leaderboard.sql` | `leaderboard` table, constraints, indexes |
| `0002_enable_rls_read_policy.sql` | RLS: public read, **no** direct writes |
| `0003_submit_score_rpc.sql` | `submit_score` RPC — server-computed score + anti-cheat + atomic upsert |
| `0004_backfill_from_COTE.sql` | Migrate legacy `COTE` rows → `leaderboard` |

## How to apply

**Option A — Supabase SQL editor (quickest):** paste each file's contents in order (0001 → 0004) into the SQL editor and run.

**Option B — Supabase CLI:**
```bash
supabase link --project-ref trxxtjilifjuqqunuzrl
supabase db push        # applies files in supabase/migrations in order
```

## After applying

No client change is needed. `src/services/leaderboard.ts` already tries the `submit_score` RPC first and only falls back to the legacy REST path on a `404`. Once the RPC exists, submissions automatically use the hardened, cheat-resistant path.

**Verify:**
1. Submit a score from the app → confirm a row appears in `leaderboard` with a server-computed `score`.
2. Attempt a direct `POST` to `/rest/v1/leaderboard` with the anon key → should be **denied** by RLS.
3. Call the RPC with an implausible score (e.g. 197 countries in 5 seconds) → should be **rejected**.

## Not included (recommended follow-up)

- An Edge Function for per-IP rate limiting in front of the RPC (doc 08 §7).
- Optional `country_reference` table (doc 08 §2.2) for future server-side validation.
