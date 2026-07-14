-- 0003_submit_score_rpc.sql
-- The ONLY sanctioned write path: validates, computes score server-side, upserts atomically.
-- See 08_SUPABASE_SCHEMA.md §5.
--
-- NOTE: OUT columns are prefixed `out_` so they don't collide with the table columns in
-- the upsert (Postgres otherwise raises "column reference is ambiguous"), and `countries`
-- is cast to int in the final SELECT because the table column is smallint. A DROP precedes
-- the CREATE because changing a function's OUT signature isn't allowed via CREATE OR REPLACE.

drop function if exists public.submit_score(text, text, int, int);

create function public.submit_score(
  p_name text,
  p_mode text,
  p_countries int,
  p_seconds int
) returns table (out_name text, out_mode text, out_countries int, out_seconds int, out_score int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name        text;
  v_score       int;
  v_min_seconds int;
begin
  -- 1. Sanitize name: strip control chars + angle brackets, clamp 1..24.
  v_name := btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]<>]', '', 'g'));
  v_name := left(v_name, 24);
  if length(v_name) = 0 then
    v_name := 'Anonymous';
  end if;

  -- 2. Validate mode.
  if p_mode not in ('10','20','30','infinite') then
    raise exception 'invalid mode';
  end if;

  -- 3. Range validation (anti-cheat).
  if p_countries < 0 or p_countries > 197 then
    raise exception 'invalid country count';
  end if;
  if p_seconds < 0 then
    raise exception 'invalid time';
  end if;

  -- 4. Plausibility: a human cannot type N distinct countries faster than ~N*0.4s.
  v_min_seconds := ceil(p_countries * 0.4);
  if p_seconds < v_min_seconds then
    raise exception 'implausible score';
  end if;

  -- 5. Countdown modes cannot exceed their budget.
  if p_mode = '10' and p_seconds > 600  then raise exception 'time exceeds mode'; end if;
  if p_mode = '20' and p_seconds > 1200 then raise exception 'time exceeds mode'; end if;
  if p_mode = '30' and p_seconds > 1800 then raise exception 'time exceeds mode'; end if;

  -- 6. Server-computed score (never trust a client-supplied score).
  v_score := p_countries * 1000 - p_seconds;

  -- 7. Atomic best-score-per-(name,mode) upsert.
  insert into public.leaderboard (name, mode, countries, seconds, score)
  values (v_name, p_mode, p_countries, p_seconds, v_score)
  on conflict (lower(name), mode)
  do update set
    countries  = excluded.countries,
    seconds    = excluded.seconds,
    score      = excluded.score,
    created_at = now()
  where excluded.score > public.leaderboard.score;   -- only if strictly better

  return query
    select l.name, l.mode, l.countries::int, l.seconds, l.score
    from public.leaderboard l
    where lower(l.name) = lower(v_name) and l.mode = p_mode;
end;
$$;

-- Lock down direct execution; grant only the RPC to public roles.
revoke all on function public.submit_score(text, text, int, int) from public;
grant execute on function public.submit_score(text, text, int, int) to anon, authenticated;
