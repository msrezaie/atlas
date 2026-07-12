-- Atlas v3 — initial schema: profiles, scores, matches (+ RLS, signup trigger,
-- leaderboard view). Auth providers (magic-link email, Google OAuth, anonymous)
-- are toggled in the Supabase dashboard, not here.

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: one row per auth.users, created automatically on signup.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text not null unique,
  role          text not null default 'player' check (role in ('player', 'admin')),
  country       text,                 -- ISO2 of their "home" flag (optional)
  avatar_config jsonb,                -- reserved for v3.3 avatars
  is_guest      boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.profiles is 'Public player profile, 1:1 with auth.users.';

-- ─────────────────────────────────────────────────────────────────────────────
-- scores: append-only, one row per completed run. Aggregations (best, leaderboard)
-- are derived, so we never lose history.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  mode       text not null check (mode in ('find', 'trivia', 'flag')),
  play       text not null check (play in ('solo', 'versus')),
  region     text not null default 'World',
  score      integer not null check (score >= 0),
  round_len  integer not null check (round_len > 0),
  created_at timestamptz not null default now()
);

create index if not exists scores_user_idx on public.scores (user_id);
create index if not exists scores_leaderboard_idx on public.scores (mode, play, score desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- matches: stub for v3.2 (real matchmaking). Enough to reference now; the
-- lifecycle columns/policies get fleshed out when we build matchmaking.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  mode       text not null check (mode in ('find', 'trivia', 'flag')),
  player_a   uuid references public.profiles (id) on delete set null,
  player_b   uuid references public.profiles (id) on delete set null,
  winner     uuid references public.profiles (id) on delete set null,
  is_bot     boolean not null default false,
  status     text not null default 'pending' check (status in ('pending', 'active', 'done', 'abandoned')),
  created_at timestamptz not null default now(),
  ended_at   timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────────
-- is_admin(): SECURITY DEFINER so it can read the caller's role regardless of
-- RLS. Used by admin-only policies and the /admin route guard.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- handle_new_user(): create a profile on signup. Derives a unique username from
-- (metadata username → email local-part → 'guest'/'player'), appending a short
-- token if taken so signup never fails on a collision.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  candidate text;
  guest     boolean := coalesce(new.is_anonymous, false);
begin
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    case when guest then 'Guest' else 'Player' end
  );

  candidate := base_name;
  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := base_name || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, username, is_guest)
  values (new.id, candidate, guest);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- prevent_role_change(): an authenticated non-admin can never change a `role`.
-- Admins (is_admin()) may. Privileged contexts — the dashboard SQL editor and
-- service-role — have no auth.uid(), so they pass through; this is what lets you
-- bootstrap the first admin. (RLS already restricts which row a user can touch,
-- and anon's NULL uid matches no row, so the NULL bypass opens no hole.)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'not allowed to change role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.scores   enable row level security;
alter table public.matches  enable row level security;

-- profiles: world-readable (usernames feed the leaderboard); a user may update
-- only their own row (the role-change trigger guards privilege escalation).
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- scores: world-readable (leaderboard); a user may insert only their own rows.
create policy "scores are viewable by everyone"
  on public.scores for select
  using (true);

create policy "users insert own scores"
  on public.scores for insert
  with check (auth.uid() = user_id);

-- matches: participants can read their own matches. Writes are service-role only
-- for now (matchmaking server, v3.2) — no insert/update policy = denied to
-- anon/authenticated, allowed to service_role which bypasses RLS.
create policy "participants read own matches"
  on public.matches for select
  using (auth.uid() = player_a or auth.uid() = player_b);

-- ─────────────────────────────────────────────────────────────────────────────
-- leaderboard: best score per (user, mode, play). security_invoker so the
-- underlying tables' RLS applies as the querying user.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.leaderboard
with (security_invoker = on) as
  select
    s.user_id,
    p.username,
    s.mode,
    s.play,
    max(s.score)  as best_score,
    count(*)      as games_played,
    max(s.created_at) as last_played
  from public.scores s
  join public.profiles p on p.id = s.user_id
  group by s.user_id, p.username, s.mode, s.play;

-- Table privileges (RLS still governs rows). Supabase roles: anon, authenticated.
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
grant select on public.scores to anon, authenticated;
grant insert on public.scores to authenticated;
grant select on public.matches to authenticated;
grant select on public.leaderboard to anon, authenticated;
