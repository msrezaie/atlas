# Architecture

How the web app (`apps/web`) is put together. For per-package detail see
[packages.md](./packages.md); for the backend see [database.md](./database.md).

## Big picture

```
Browser ── Next.js 16 (apps/web) ──── Supabase
             │  React 19 App Router      │  Postgres + RLS
             │  Client-driven game UI    │  Auth (Google OAuth)
             │  proxy.ts middleware ─────┤  Realtime (presence, broadcast)
             │                           │  RPC functions (matchmaking…)
             └── @atlas/* packages       └── migrations/ (SQL)
                 (data, types, logic, tokens)
```

The web app is a **single-page game** rendered by the App Router. The player
experience lives almost entirely on the client (`AtlasGame.tsx`), while auth,
scores, leaderboards, and matchmaking talk to Supabase. A handful of real routes
exist alongside the game (marketing pages, the OAuth callback, and the admin
dashboard).

## Routes (`apps/web/app`)

| Route                                                         | Type          | Purpose                                             |
| ------------------------------------------------------------- | ------------- | --------------------------------------------------- |
| `/` (`page.tsx`)                                              | Client        | Mounts `AtlasGame` — the whole game experience      |
| `/auth/callback` (`route.ts`)                                 | Route handler | OAuth PKCE code exchange (see [auth.md](./auth.md)) |
| `/admin`, `/admin/users`, `/admin/countries`, `/admin/config` | Server        | Admin dashboard (gated in middleware)               |
| `/about`, `/how-to-play`, `/privacy`, `/terms`                | Static        | Marketing / legal pages                             |

`proxy.ts` (Next 16's renamed `middleware`) runs on every non-asset request: it
refreshes the Supabase session cookie and gates `/admin/**` to admins.

## The game as a state machine

`apps/web/app/components/AtlasGame.tsx` is the heart of the app. Rather than
file-based routing per screen, it holds a single `screen` state and swaps
screen components in and out:

```
landing → login → solo-hub  → find | trivia | flag → results
                → versus-hub → matchmaking → find | trivia | flag → results
                → account
                → learning (Explore)
```

Screens live in `apps/web/app/components/screens/`:

| Screen                                                     | Role                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `LandingScreen`                                            | Scrollable marketing landing with the scroll-linked globe |
| `LoginScreen`                                              | Google sign-in (required before 1v1)                      |
| `AccountScreen`                                            | Profile / sign-out                                        |
| `SoloHubScreen` / `VersusHubScreen`                        | Mode pickers + leaderboards                               |
| `MatchmakingScreen`                                        | 1v1 pairing UI (uses `useMatchmaking`)                    |
| `FindCountryScreen` / `TriviaScreen` / `FlagGuesserScreen` | The three game modes                                      |
| `LearningScreen`                                           | Explore mode (map + country facts, no scoring)            |
| `ResultsScreen`                                            | Post-round summary (solo + versus)                        |

`AtlasGame` also owns cross-screen concerns: the current `RoundConfig`, the
resolved 1v1 `MatchInfo`, the player's local best scores (localStorage), and
persisting finished runs to Supabase via `lib/scores.ts`.

## The persistent globe

The landing/hub screens sit over a **single persistent globe** instance
(`components/shared/TiltedGlobe.tsx`, a d3-geo projection). It never remounts as
you navigate — only its framing eases toward a per-screen "anchor" (bottom for
landing, left for solo, right for versus, center for matchmaking), so moving
between screens reads as one continuous globe rather than a cut. On the landing
page the globe is additionally **glued to scroll**: `LandingScreen` hands
`AtlasGame` a ref-reading `getTarget(w,h)` driver that the globe polls each
frame, so scrolling never re-renders React. Gameplay/learning/results screens
fade it out entirely.

## The `lib/` layer (`apps/web/app/lib`)

Client-side glue between the UI and the packages/backend:

| File                                                 | Responsibility                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `auth/AuthProvider.tsx`                              | React context for the Supabase session; Google sign-in; post-redirect URL cleanup |
| `supabase/client.ts` / `server.ts` / `middleware.ts` | `@supabase/ssr` clients for browser / route handlers / middleware                 |
| `supabase/env.ts`                                    | Validated env var access                                                          |
| `presence.tsx`                                       | App-wide "who's online" via a Realtime presence channel (signed-in users)         |
| `match/useMatchmaking.ts`                            | Enters the queue, pairs with a human or falls back to a bot                       |
| `match/useMatchChannel.ts`                           | In-match broadcast channel (guess/resolve messages)                               |
| `match/types.ts`                                     | `MatchInfo` shape                                                                 |
| `scores.ts` / `leaderboard.ts`                       | Persist runs; read leaderboards                                                   |
| `gameMode.ts`                                        | `GameMode`, `PlayMode`, `RoundConfig`, mode metadata                              |
| `countryMap.ts` / `mapVisuals.ts`                    | MapLibre helpers shared by the map screens                                        |
| `trivia.ts` / `flagGuesser.ts`                       | Question generation for trivia / flags                                            |

## Data flow, end to end (a solo Find run)

1. `SoloHubScreen` builds a `RoundConfig` and calls `AtlasGame.startSolo`.
2. `FindCountryScreen` draws a seeded/shuffled question set from `@atlas/data`
   (via `@atlas/game-logic`) and renders the MapLibre map.
3. Each answer is scored by `@atlas/game-logic` (speed + streak).
4. On finish, `AtlasGame.finish` updates the local best and fire-and-forget
   saves the run to Supabase (`lib/scores.ts` → `scores` table).
5. `ResultsScreen` shows the summary; the hub's leaderboard reflects the new run.

For the 1v1 variant of this flow (pairing + live head-to-head), see
[game-design.md](./game-design.md).

## Rendering notes

- **Client-heavy by design.** The game is interactive and stateful, so most of
  it is `"use client"`. Server components/route handlers are reserved for auth,
  the admin dashboard, and static pages.
- **Hydration safety.** Anything read from `localStorage` (best scores) is filled
  in _after_ mount, never in initial state, so server and first client render
  match.
- **Styling** is token-driven via CSS custom properties emitted by
  `@atlas/tokens` (see [design-system.md](./design-system.md)) plus Tailwind v4.
