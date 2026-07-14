-- 0004_backfill_from_COTE.sql
-- Migrate existing legacy `COTE` rows into `leaderboard`. See 08_SUPABASE_SCHEMA.md §9.
-- Legacy rows have no mode → map to 'infinite'; recompute score server-side for consistency.
-- Safe to run once; the unique index keeps only the best per (name, 'infinite').

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'COTE'
  ) then
    insert into public.leaderboard (name, mode, countries, seconds, score)
    select
      left(btrim(regexp_replace(coalesce(c.name, 'Anonymous'), '[[:cntrl:]<>]', '', 'g')), 24),
      'infinite',
      greatest(0, least(197, c.countries)),
      greatest(0, c.seconds),
      greatest(0, least(197, c.countries)) * 1000 - greatest(0, c.seconds)
    from public."COTE" c
    on conflict (lower(name), mode) do update
      set countries = excluded.countries,
          seconds   = excluded.seconds,
          score     = excluded.score
      where excluded.score > public.leaderboard.score;
  end if;
end $$;

-- After verifying the backfill, the legacy table can be dropped:
--   drop table if exists public."COTE";
