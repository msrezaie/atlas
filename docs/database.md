# Database

The app uses Supabase (Postgres) for auth, profiles, scores, leaderboards, and
matchmaking. All schema lives in `supabase/migrations/` as ordered SQL and is the
source of truth — apply migrations `0001` → `0007` in order.

> Access model: the app only ever uses the **publishable (anon) key**. Every
> table is protected by Row-Level Security, and privileged operations run through
> `SECURITY DEFINER` RPC functions. There is no service-role key in the app.

## Tables

### `profiles`

One row per user, keyed to `auth.users`. Created automatically on signup by the
`handle_new_user` trigger.

| Column          | Notes                                      |
| --------------- | ------------------------------------------ |
| `id`            | PK → `auth.users(id)`                      |
| `username`      | unique, not null                           |
| `role`          | `'player'` \| `'admin'` (default `player`) |
| `country`       | ISO2 of a "home" flag (optional)           |
| `avatar_config` | `jsonb`, reserved for future avatars       |
| `is_guest`      | boolean (legacy; guest play was removed)   |
| `created_at`    | timestamptz                                |

### `scores`

One row per finished run — feeds the leaderboards.

| Column               | Notes                                                        |
| -------------------- | ------------------------------------------------------------ |
| `id`                 | PK                                                           |
| `user_id`            | → `profiles(id)`                                             |
| `mode`               | `'find' \| 'trivia' \| 'flag'`                               |
| `play`               | `'solo' \| 'versus'`                                         |
| `region`             | default `'World'`                                            |
| `score`, `round_len` | the run                                                      |
| `won`, `opp_score`   | versus only (added in `0003`)                                |
| `duration_ms`        | run wall-clock, for "fastest" leaderboards (added in `0004`) |

### `matches`

One row per 1v1 match (created by `find_match`).

| Column                             | Notes                                                              |
| ---------------------------------- | ------------------------------------------------------------------ |
| `id`                               | PK                                                                 |
| `mode`                             | `'find' \| 'trivia' \| 'flag'`                                     |
| `player_a`, `player_b`             | participants; `player_a` is the host                               |
| `winner`                           | → `profiles(id)`, set by `finish_match`                            |
| `is_bot`, `status`                 | `status`: `pending \| active \| done \| abandoned`                 |
| `seed`                             | shared seed → both clients derive the same question order (`0005`) |
| `region`, `created_at`, `ended_at` |                                                                    |

### `match_queue` (`0005`)

Players currently searching — one row each (`user_id` PK, `mode`, `created_at`).
Used by `find_match` to pair searchers.

## Views

- **`leaderboard`** (`0003`) — aggregate ranking across scores.
- **`player_stats`** (`0003`, extended `0004`) — per-player rollups including
  best/average time. Note `0004` `drop`s and recreates the view because it
  reorders columns (a plain `create or replace view` can't rename/reorder).

## Functions (RPC)

| Function                             | Security          | Purpose                                                                                                    |
| ------------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `handle_new_user()`                  | definer (trigger) | Creates a `profiles` row on signup                                                                         |
| `prevent_role_change()`              | definer (trigger) | Blocks users from escalating their own `role`; allows privileged/dashboard contexts (`auth.uid() is null`) |
| `is_admin()`                         | invoker           | Whether the caller is an admin (used by RLS/gates)                                                         |
| `find_match(p_mode)`                 | definer           | Atomically pair the caller with a fresh waiting player, else enqueue them; returns the match row or null   |
| `leave_queue()`                      | definer           | Remove the caller from the queue                                                                           |
| `finish_match(p_match_id, p_winner)` | definer           | Record the winner once, while the match is still `active`                                                  |

`find_match` uses `FOR UPDATE SKIP LOCKED` so two callers can't claim the same
opponent, and a **freshness window** so a stopped/closed searcher can't be
matched (see the matchmaking section of [game-design.md](./game-design.md)).

## Row-Level Security (highlights)

- **profiles** — readable by everyone; a user may update only their own row, and
  `prevent_role_change` stops self-promotion to `admin`.
- **scores** — readable by everyone (leaderboards); a user may insert only their
  own scores.
- **matches** — participants can read their own matches; writes go through the
  `SECURITY DEFINER` RPCs.
- **match_queue** — a user manages only their own queue row.

## Realtime

`matches` is added to the `supabase_realtime` publication (`0005`) so
participants receive INSERT/UPDATE events (used to learn you've been paired).
Presence and in-match guess/resolve messaging use Realtime **channels**
(presence + broadcast), which don't require table publication.

## Migrations

| File                             | What it adds                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `0001_initial_schema.sql`        | profiles/scores/matches, RLS, signup trigger, `is_admin`, leaderboard                                       |
| `0002_harden_functions.sql`      | Hardens function security (`is_admin` → invoker; revoke EXECUTE on trigger fns)                             |
| `0003_leaderboard.sql`           | `player_stats` view; `scores.won` / `opp_score`                                                             |
| `0004_fastest_time.sql`          | `scores.duration_ms`; best/avg time in `player_stats`                                                       |
| `0005_matchmaking.sql`           | `match_queue`; `find_match` / `leave_queue` / `finish_match`; `matches.seed`/`region`; realtime publication |
| `0006_matchmaking_freshness.sql` | `find_match` ignores/sweeps stale queue rows                                                                |
| `0007_matchmaking_heartbeat.sql` | Tightens the freshness window for the client heartbeat                                                      |

### Applying migrations

- **SQL Editor:** run each file's contents in order.
- **Supabase CLI:** `supabase db push` against your linked project.

Some functions include a body that must be pasted into the **SQL Editor** (not
the Functions UI, which expects only the body).

## Bootstrapping the first admin

The `prevent_role_change` trigger blocks users from changing their own `role`,
but it lets privileged/no-session contexts through (`auth.uid() is null`). So set
your first admin from the **SQL Editor**:

```sql
update public.profiles set role = 'admin' where username = '<your-username>';
```

After that, `/admin` is accessible to that account (the middleware checks
`profiles.role`).
