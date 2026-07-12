-- 0006: matchmaking freshness — only pair players who are actively searching.
--
-- A queue row is treated as "live" only for a short window. Rows older than that
-- (a client that stopped searching without cleanup, an abruptly-closed tab, or a
-- leftover from a prior session) are ignored and swept — so a player can no
-- longer be matched with someone who isn't currently searching, and a lone
-- searcher no longer matches a ghost instantly (they wait, then get a bot).
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
  delete from public.match_queue where created_at < now() - interval '12 seconds';

  -- Oldest *fresh* other searcher, row-locked so two callers can't both claim it.
  select user_id into v_opponent
  from public.match_queue
  where mode = p_mode
    and user_id <> auth.uid()
    and created_at > now() - interval '12 seconds'
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
