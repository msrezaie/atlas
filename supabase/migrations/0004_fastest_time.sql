-- v3.1 leaderboard: track solo speed and expose a "fastest" ranking.

-- Total wall-clock time of a solo run (from first question to the last answer),
-- so we can compare players on average time per question. Null on rows that
-- didn't record it (e.g. versus, or modes not yet timed).
alter table public.scores add column if not exists duration_ms integer;

-- Recreate player_stats with the speed columns: best (fastest) average ms per
-- question across timed solo runs, and a count of timed runs to filter on.
-- Dropped first (not CREATE OR REPLACE) because the new columns change the
-- column list/order, which REPLACE rejects.
drop view if exists public.player_stats;
create view public.player_stats
with (security_invoker = on) as
  select
    p.id       as user_id,
    p.username,
    coalesce(sum(s.score) filter (where s.play = 'solo'), 0)::int        as solo_xp,
    count(*) filter (where s.play = 'versus' and s.won is true)          as versus_wins,
    count(*) filter (where s.play = 'versus')                            as versus_games,
    count(*) filter (where s.play = 'solo')                              as solo_games,
    count(*) filter (where s.play = 'solo' and s.duration_ms is not null) as timed_solo_games,
    coalesce(max(s.score) filter (where s.play='solo' and s.mode='find'), 0)::int   as best_find,
    coalesce(max(s.score) filter (where s.play='solo' and s.mode='trivia'), 0)::int as best_trivia,
    coalesce(max(s.score) filter (where s.play='solo' and s.mode='flag'), 0)::int   as best_flag,
    (
      min(s.duration_ms::numeric / nullif(s.round_len, 0))
        filter (where s.play = 'solo' and s.duration_ms is not null)
    )::int as best_avg_ms,
    (
      coalesce(sum(s.score) filter (where s.play = 'solo'), 0)
      + 30 * count(*) filter (where s.play = 'versus' and s.won is true)
      + 10 * count(*) filter (where s.play = 'versus' and s.won is false)
    )::int as total_xp
  from public.profiles p
  left join public.scores s on s.user_id = p.id
  where p.is_guest = false
  group by p.id, p.username;

grant select on public.player_stats to anon, authenticated;
