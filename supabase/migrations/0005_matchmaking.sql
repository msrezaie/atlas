-- v3.2 stage 2: real 1v1 matchmaking.

-- Players currently searching, one row each.
create table if not exists public.match_queue (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  mode       text not null check (mode in ('find', 'trivia', 'flag')),
  created_at timestamptz not null default now()
);

alter table public.match_queue enable row level security;

-- A player only ever manages their own queue row.
drop policy if exists "manage own queue row" on public.match_queue;
create policy "manage own queue row" on public.match_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Flesh out matches for real play: a shared seed (both clients generate the same
-- question set from it) and the region.
alter table public.matches add column if not exists seed bigint;
alter table public.matches add column if not exists region text not null default 'World';

-- find_match: atomically pair the caller with the oldest other waiting player
-- for the mode, else enqueue them. SECURITY DEFINER so it can touch both queue
-- rows and create the match regardless of RLS. Returns the match row when
-- paired, or null when the caller was enqueued to keep waiting.
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

  -- Oldest other waiting player, row-locked so two callers can't both claim it.
  select user_id into v_opponent
  from public.match_queue
  where mode = p_mode and user_id <> auth.uid()
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

-- leave_queue: stop searching (cancel / bot fallback).
create or replace function public.leave_queue()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.match_queue where user_id = auth.uid();
$$;

-- finish_match: a participant reports the final result once. Only sets it while
-- the match is still active, so a loser can't overwrite it afterward.
create or replace function public.finish_match(p_match_id uuid, p_winner uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.matches
  set status = 'done', winner = p_winner, ended_at = now()
  where id = p_match_id
    and status = 'active'
    and (player_a = auth.uid() or player_b = auth.uid());
end;
$$;

grant execute on function public.find_match(text) to authenticated;
grant execute on function public.leave_queue() to authenticated;
grant execute on function public.finish_match(uuid, uuid) to authenticated;

-- Realtime: deliver matches INSERT/UPDATE to participants (matches RLS already
-- limits select to them). Guarded so re-running the migration doesn't error.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;
