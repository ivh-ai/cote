-- 0002_enable_rls_read_policy.sql
-- Row Level Security: public read, NO direct writes. See 08_SUPABASE_SCHEMA.md §6.

alter table public.leaderboard enable row level security;

-- Anyone may READ the leaderboard (public board, no account needed — FR-LB-4).
drop policy if exists leaderboard_read on public.leaderboard;
create policy leaderboard_read
  on public.leaderboard for select
  to anon, authenticated
  using (true);

-- Table-level privilege: RLS governs WHICH rows, but Postgres still requires a GRANT for the
-- role to touch the table at all. (Tables created via raw SQL don't get this automatically the
-- way dashboard-created tables do.) Grant read only — writes go through the RPC.
grant select on public.leaderboard to anon, authenticated;

-- No INSERT/UPDATE/DELETE policies are created, so RLS denies those to anon/authenticated.
-- All writes go exclusively through the submit_score() security-definer RPC (migration 0003).
