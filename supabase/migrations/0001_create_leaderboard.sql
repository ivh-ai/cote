-- 0001_create_leaderboard.sql
-- Hardened leaderboard table + indexes. See 08_SUPABASE_SCHEMA.md §2, §4.

create table if not exists public.leaderboard (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  mode          text        not null default 'infinite',
  countries     smallint    not null,
  seconds       integer     not null,
  score         integer     not null,
  created_at    timestamptz not null default now(),
  client_nonce  uuid,
  constraint leaderboard_countries_range check (countries between 0 and 197),
  constraint leaderboard_seconds_nonneg  check (seconds >= 0),
  constraint leaderboard_mode_valid      check (mode in ('10','20','30','infinite'))
);

-- Fast top-N per mode (the hot read path).
create index if not exists leaderboard_mode_score_idx
  on public.leaderboard (mode, score desc, seconds asc);

-- One row per name+mode (case-insensitive) — enforces best-score-per-name.
create unique index if not exists leaderboard_name_mode_uidx
  on public.leaderboard (lower(name), mode);

-- Recent-activity lookups (rate limiting).
create index if not exists leaderboard_created_idx
  on public.leaderboard (created_at desc);
