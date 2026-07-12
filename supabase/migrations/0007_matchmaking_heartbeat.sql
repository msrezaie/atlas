-- 0007: tighten matchmaking freshness for the client heartbeat.
--
-- The client now re-polls find_match every ~2s while searching (see
-- useMatchmaking), so a live searcher's queue row is refreshed continuously.
-- That lets us shrink the "live" window from 12s to 5s: a client that stops
-- polling (closed tab, cancelled search, crashed) goes stale — and stops being
-- matchable — within a few seconds, instead of lingering long enough to hand a
-- lone searcher an instant match with someone who isn't there. Two genuinely
-- searching players still match, because both keep their rows fresh.
--
-- 5s (> two 2s heartbeats) leaves margin for network jitter so a live searcher
-- is never swept between beats.
create or replace function public.find_match(p_mode text)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opponent uuid;
  v_match public.matches;
begin
  if auth.uid() is null then
    raise exception 'must be signed in';
  end if;

  -- Sweep stale rows (older than the search window).
  delete from public.match_queue where created_at < now() - interval '5 seconds';

  -- Oldest *fresh* other searcher, row-locked so two callers can't both claim it.
  select user_id into v_opponent
  from public.match_queue
  where mode = p_mode
    and user_id <> auth.uid()
    and created_at > now() - interval '5 seconds'
  order by created_at
  for update skip locked
  limit 1;

  if v_opponent is null then
    insert into public.match_queue (user_id, mode)
    values (auth.uid(), p_mode)
    on conflict (user_id) do update set mode = excluded.mode, created_at = now();
    return null;
  end if;

  delete from public.match_queue where user_id in (v_opponent, auth.uid());
  insert into public.matches (mode, player_a, player_b, is_bot, status, seed, region)
  values (
    p_mode, v_opponent, auth.uid(), false, 'active',
    (random() * 9223372036854775807)::bigint, 'World'
  )
  returning * into v_match;
  return v_match;
end;
$$;
