# Game design

How scoring, matchmaking, the live 1v1 race, and leaderboards work. The rules
live in `@atlas/game-logic` (framework-agnostic) and are wired to the UI by the
screen components in `apps/web/app/components/screens/`.

## Modes and play types

- **Modes:** Find the Country, Geo Trivia, Flag Guesser, plus Explore (learning,
  unscored).
- **Play types:** `solo` (beat your own best) and `versus` (1v1). 1v1 is always a
  fixed, fair, worldwide round and requires sign-in.

## Solo scoring

Solo rewards speed and consistency. Per round the stake is a function of the time
left when you answer (`pointsForTime` in `@atlas/game-logic/config`), following a
gentle step curve, and a **streak** multiplies sustained correct answers. Find
the Country also records `duration_ms` (wall-clock from first question to finish)
for the "fastest" leaderboard.

Constants (tunable, and destined for admin config later) live in
`@atlas/game-logic/config`: time limit, round length, max points, and the score
step curve.

## 1v1 matchmaking

Two signed-in players are paired through Supabase. Timing tunables are in
`@atlas/game-logic/matchmaking`.

**Pairing (`lib/match/useMatchmaking.ts` + `find_match` RPC):**

1. On entering matchmaking, the client subscribes to `matches` realtime INSERTs,
   then calls `find_match`.
2. `find_match` atomically pairs the caller with the oldest **fresh** waiting
   player (`FOR UPDATE SKIP LOCKED`), else enqueues them and returns null.
3. A **heartbeat** re-polls `find_match` every ~2s, which refreshes the caller's
   queue row. Combined with a short **freshness window** (`0006`/`0007`), a
   player who stops searching (cancel, closed tab) goes stale within a few
   seconds and can't be matched — so a lone searcher waits out the window instead
   of matching a "ghost".
4. If no human is found within the search window (~5–9s), the client falls back
   to a **bot**.
5. When leaving the queue, the client waits for any in-flight `find_match` to
   finish before deleting its row, so a late enqueue can't re-create a ghost.

Only signed-in users are counted "online" (Realtime presence, `lib/presence.tsx`).

## In-match live sync (real 1v1)

Once paired, the two clients race over a Supabase Realtime **broadcast** channel,
`match:<id>` (`lib/match/useMatchChannel.ts`). The design is
**host-authoritative** so the two clients can never disagree on a close finish.

- **Same questions.** Both clients derive the identical question order from the
  match's shared `seed` via `seededShuffle` (`@atlas/game-logic/seed`) — the seed
  is a bigint that may arrive as a number or a string; `seedTo32` normalises it.
- **Guessing.** Each player sends one `guess` message per round:
  `{ round, playerId, correct, elapsedMs }`.
- **Resolution.** The **host** (`matches.player_a`) decides each round — first
  correct wins, with `elapsedMs` breaking a both-correct tie — and broadcasts a
  `resolve` message carrying the winner's id. Both clients apply that outcome
  from their own perspective (`winnerId === me ? "you" : …`).
- **Robustness.** The non-host has a fallback timer so a dropped `resolve` or a
  host disconnect never stalls a round. The host records the final result once
  via `finish_match`.

Round-resolution rules (shared with the bot path): a round ends only when someone
is **correct**, or **both** players have guessed (neither correct), or the timer
expires. A single wrong guess does **not** end the round — the other player still
gets their chance.

## Leaderboards

Runs are saved to `scores` (`lib/scores.ts`); leaderboards read aggregate views
(`leaderboard`, `player_stats`) via `lib/leaderboard.ts` and appear on the solo
and versus hubs. XP accumulates from solo scores and 1v1 wins, and a fastest-time
display uses `duration_ms`.

## Where the numbers live

| Concern                                 | Location                                          |
| --------------------------------------- | ------------------------------------------------- |
| Scoring curve, time limit, round length | `@atlas/game-logic/config`                        |
| Matchmaking search window, reveal beat  | `@atlas/game-logic/matchmaking`                   |
| Deterministic question order            | `@atlas/game-logic/seed`                          |
| Queue freshness window                  | `find_match` (`supabase/migrations/0006`, `0007`) |

Keeping these in packages/SQL (not buried in components) is deliberate: it's what
lets the planned mobile app reuse the rules, and what will later be exposed to the
admin config.
