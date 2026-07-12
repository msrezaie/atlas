# Packages & apps

The monorepo is a pnpm workspace (`apps/*` + `packages/*`) orchestrated by
Turborepo. Workspace packages are referenced as `workspace:*` and consumed as
**TypeScript source** — there is no build/compile step for them; the apps'
bundlers transpile them directly.

## Apps

### `apps/web` — the product

The Next.js 16 player app + admin dashboard. This is the only deployed app. See
[architecture.md](./architecture.md). Depends on every `@atlas/*` package and
`@repo/ui`.

- Dev: `pnpm --filter web dev` (port 3000)
- Package name: `web`

### `apps/docs` — placeholder

The **unmodified `create-turbo` starter app**. It's a second Next.js app that
renders the Turborepo welcome page (logo + "edit `apps/docs/app/page.tsx`"). It
exists to demonstrate the monorepo's shared-package wiring (it imports `Button`
from `@repo/ui`) and is built/linted/typechecked by Turbo like any other app,
but it is **not documentation and not deployed** — nothing links to it.

- Dev: `pnpm --filter docs dev` (port 3001)
- Package name: `docs`

> Project documentation currently lives in this `docs/` folder as Markdown, not
> in the `apps/docs` app. Turning `apps/docs` into a real, browsable docs site
> (e.g. Nextra/Fumadocs rendering this Markdown) is a possible future step.

### `apps/mobile` — planned

An **Expo / React Native scaffold** (Expo ~56, RN 0.85, React 19). Currently just
the starter (`App.tsx`), not built out. When it is, it will reuse the
framework-agnostic packages below (`@atlas/data`, `@atlas/types`,
`@atlas/game-logic`, `@atlas/tokens`) directly, while its UI is rebuilt in RN.

## Packages

### `@atlas/data`

Canonical country dataset — the single source of country facts used everywhere.
Exports (`.`, `./countries`, `./map`, `./regions`): country records (name,
ISO2, continent, capital, population, area, lat/lng, and extended facts), the
MapLibre id ↔ ISO2 mapping and excluded-territory list, and region groupings.

### `@atlas/types`

Shared, dependency-free TypeScript types: `Continent`, `Region`, `Country`,
`MapState` (`neutral | correct | incorrect | found | missed`), `RoundResult`,
etc. Imported by data, game-logic, and the apps so they agree on shapes.

### `@atlas/game-logic`

Framework-agnostic game rules (no DOM, no React) — fully reusable by web and
mobile. Exports:

| Entry            | Contents                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `.` / `./config` | Scoring constants + `pointsForTime`, round length, time limit                                                 |
| `./utils`        | `shuffle`, `filterRegion`, and other pure helpers                                                             |
| `./matchmaking`  | Matchmaking timing tunables (`MATCH_SEARCH_MIN/MAX_MS`, `MATCH_REVEAL_MS`)                                    |
| `./seed`         | `mulberry32`, `seedTo32`, `seededShuffle` — deterministic RNG so both 1v1 players get the same question order |

### `@atlas/tokens`

The design-system source of truth: colours, spacing, type scale, radii, shadows,
motion — as typed TS. It emits the web's CSS custom properties **and** exposes a
resolved, DOM-free `tokens` object for React Native. Full detail:
[design-system.md](./design-system.md).

### `@repo/ui`

A minimal shared React component stub (e.g. `Button`) from the starter. `web`'s
real component library lives in `apps/web/app/components/`; `@repo/ui` is shared
scaffolding used by `docs` (and available to `web`).

### `@repo/eslint-config` / `@repo/typescript-config`

Shared ESLint (`./base`, `./next-js`, `./react-internal`) and `tsconfig`
presets used across the workspace.

## Dependency graph (who uses what)

```
@atlas/types  ←── @atlas/data ←── @atlas/game-logic
      ↑                ↑                 ↑
      └────────────────┴───────┬─────────┘
                               │
              @atlas/tokens    │      @repo/ui
                    ↑          │         ↑
                    └── apps/web ────────┘
                        apps/mobile (planned) → @atlas/* (logic/data/types/tokens)
                        apps/docs → @repo/ui
```

## Turborepo

`turbo.json` defines the task pipeline:

- `build` — depends on upstream `^build`; caches `.next/**` (minus caches/dev)
- `lint`, `check-types` — fan out across the workspace
- `dev` — non-cached, persistent

Run tasks from the root (`pnpm build`, `pnpm lint`, `pnpm check-types`) or scope
with `--filter`.
