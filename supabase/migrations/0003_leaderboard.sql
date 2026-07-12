-- v3.1 leaderboard & scoring.

-- Versus outcome columns on scores (null for solo rows). `won` drives 1v1 win
-- counts; `opp_score` is kept for richer stats / tie-breaks later.
alter table public.scores add column if not exists won boolean;
alter table public.scores add column if not exists opp_score integer;

-- The speculative view from 0001 is superseded by player_stats below.
drop view if exists public.leaderboard;

-- Per-player aggregate powering the Solo and 1v1 leaderboards. XP accumulates:
-- every solo game contributes its score; each 1v1 win is worth 30, each loss 10.
-- Guests are excluded. security_invoker so the underlying tables' RLS (both are
-- world-readable) governs access.
create or replace view public.player_stats
with (security_invoker = on) as
  select
    p.id       as user_id,
    p.username,
    coalesce(sum(s.score) filter (where s.play = 'solo'), 0)::int        as solo_xp,
    count(*) filter (where s.play = 'versus' and s.won is true)          as versus_wins,
    count(*) filter (where s.play = 'versus')                            as versus_games,
    count(*) filter (where s.play = 'solo')                              as solo_games,
    coalesce(max(s.score) filter (where s.play='solo' and s.mode='find'), 0)::int   as best_find,
    coalesce(max(s.score) filter (where s.play='solo' and s.mode='trivia'), 0)::int as best_trivia,
    coalesce(max(s.score) filter (where s.play='solo' and s.mode='flag'), 0)::int   as best_flag,
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
