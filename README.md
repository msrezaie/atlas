# Atlas

> **Atlas** is the working **codename** for this project — the public name and
> branding aren't finalized. It's used for the repo, the `@atlas/*` package
> scope, and internal references only.

A geography game where you race the map. Locate countries, answer geo-trivia,
and guess flags — solo against your own best time, or 1v1 against another player
in a live "first correct wins" race. Built as a [Turborepo](https://turborepo.dev)
monorepo with a Next.js web app, a Supabase backend, and a shared TypeScript core.

- **Live (staging):** https://atlas-guesser.netlify.app
- **Docs:** see [`docs/`](./docs) — start with [`docs/architecture.md`](./docs/architecture.md)

> Staging build — not yet branded or on a custom domain.

## Game modes

| Mode                 | What you do                                               | Solo | 1v1 |
| -------------------- | --------------------------------------------------------- | :--: | :-: |
| **Find the Country** | Locate the prompted country on a live MapLibre map        |  ✓   |  ✓  |
| **Geo Trivia**       | Answer multiple-choice questions about countries          |  ✓   |  ✓  |
| **Flag Guesser**     | Match flags to countries                                  |  ✓   |  ✓  |
| **Explore**          | Browse countries/regions on a map with facts (no scoring) |  ✓   |  —  |

Solo runs are scored on speed and streak; 1v1 pairs two signed-in players over
Supabase Realtime and resolves each round to whoever answers correctly first.
See [`docs/game-design.md`](./docs/game-design.md).

## Monorepo layout

```
atlas/
├─ apps/
│  ├─ web/      Next.js 16 player app + admin dashboard (the product)
│  ├─ docs/     Turborepo starter app (placeholder — see docs/packages.md)
│  └─ mobile/   Expo / React Native scaffold (planned; not yet built out)
├─ packages/
│  ├─ @atlas/data         Canonical country data (names, flags, facts, map ids)
│  ├─ @atlas/types        Shared TypeScript types (Country, Region, MapState…)
│  ├─ @atlas/game-logic   Framework-agnostic rules: scoring, matchmaking, seeded RNG
│  ├─ @atlas/tokens       Design tokens (source of truth for web CSS + RN)
│  ├─ @repo/ui            Shared React component stub
│  ├─ @repo/eslint-config
│  └─ @repo/typescript-config
└─ supabase/
   └─ migrations/         SQL schema, RLS, and RPCs (0001…0007)
```

Only `apps/web` is a real, deployed app today. The `@atlas/*` packages are
consumed as TypeScript source (no build step) by the apps.

## Tech stack

- **Next.js 16** (App Router, React 19, Turbopack) — web app + admin
- **Supabase** — Postgres, Row-Level Security, Auth (Google OAuth), Realtime
- **MapLibre GL JS** + **d3-geo** — the interactive maps and landing globe
- **Turborepo** + **pnpm** workspaces — monorepo orchestration
- **Netlify** — hosting (staging)

## Quick start

Prerequisites: **Node ≥ 20** (tested on 22) and **pnpm 9**.

```sh
pnpm install

# configure the web app's Supabase connection
cp apps/web/.env.example apps/web/.env.local   # then fill in the two values

pnpm dev            # runs every app via turbo (web on :3000, docs on :3001)
# or just the web app:
pnpm --filter web dev
```

Full setup, env vars, and Supabase provisioning: [`docs/getting-started.md`](./docs/getting-started.md).

## Scripts (repo root)

| Command            | What it does                                      |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | `turbo run dev` — all apps in watch mode          |
| `pnpm build`       | `turbo run build` — build all apps/packages       |
| `pnpm lint`        | `turbo run lint`                                  |
| `pnpm check-types` | `turbo run check-types` — typecheck the workspace |
| `pnpm format`      | Prettier over `**/*.{ts,tsx,md}`                  |

Scope any of these to one package with `--filter`, e.g. `pnpm --filter web build`.

## Documentation

| Doc                                             | Contents                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [architecture.md](./docs/architecture.md)       | How the web app is structured — screens, the state machine, the persistent globe, data flow |
| [getting-started.md](./docs/getting-started.md) | Prerequisites, install, env vars, Supabase setup, running each app                          |
| [packages.md](./docs/packages.md)               | Every workspace package and app, what it does, and how they depend on each other            |
| [database.md](./docs/database.md)               | Supabase schema, RLS, RPC functions, and the migration workflow                             |
| [auth.md](./docs/auth.md)                       | The Google OAuth / PKCE flow, `@supabase/ssr`, and the Netlify host gotcha                  |
| [game-design.md](./docs/game-design.md)         | Scoring, 1v1 matchmaking, in-match live sync, leaderboards                                  |
| [design-system.md](./docs/design-system.md)     | `@atlas/tokens`: one source of truth for web CSS and React Native                           |
| [deployment.md](./docs/deployment.md)           | Deploying the web app (Netlify) + the Supabase/Google redirect wiring                       |
