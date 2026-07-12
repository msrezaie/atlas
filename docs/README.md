# Documentation

Developer documentation for the monorepo (working codename **Atlas** — branding
not finalized). Start here, or jump to a topic.

| Doc                                        | Read it for                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| [architecture.md](./architecture.md)       | How `apps/web` is structured — routes, the screen state machine, the persistent globe, the `lib/` layer, and end-to-end data flow |
| [getting-started.md](./getting-started.md) | Prerequisites, install, env vars, Supabase provisioning, running each app, ports                                                  |
| [packages.md](./packages.md)               | Every workspace app and package, what each does, and the dependency graph                                                         |
| [database.md](./database.md)               | Supabase schema (tables/views), RLS, RPC functions, migrations, and admin bootstrap                                               |
| [auth.md](./auth.md)                       | Google OAuth / PKCE via `@supabase/ssr`, the three clients, and the multi-hostname gotcha                                         |
| [game-design.md](./game-design.md)         | Scoring, 1v1 matchmaking + queue freshness, host-authoritative live sync, leaderboards                                            |
| [design-system.md](./design-system.md)     | `@atlas/tokens` — one source of truth for web CSS and React Native                                                                |
| [deployment.md](./deployment.md)           | Netlify deploy + Supabase/Google redirect wiring                                                                                  |

## Conventions

- **Source of truth for schema** is `supabase/migrations/` (applied in order).
- **Design tokens** are generated from `@atlas/tokens`; don't hand-edit the
  `*.generated.css` files.
- **Game rules** live in `@atlas/game-logic`, not in components.
- New dependency in a `package.json`? Commit the updated `pnpm-lock.yaml` too.

> Note: these docs are Markdown in the repo. The `apps/docs` app is currently the
> unmodified Turborepo starter (a placeholder), **not** a rendered docs site —
> see [packages.md](./packages.md#appsdocs--placeholder).
