# Getting started

Local setup for developing the app.

## Prerequisites

- **Node ≥ 20** (the repo is developed/tested on Node 22; `engines` requires ≥ 18)
- **pnpm 9** — the repo pins `packageManager: "pnpm@9.0.0"`. Install with
  `corepack enable && corepack prepare pnpm@9 --activate`, or `npm i -g pnpm@9`.
- A **Supabase project** (free tier is fine) for auth, data, and matchmaking.

## 1. Install

```sh
git clone <repo-url> atlas
cd atlas
pnpm install
```

pnpm installs the whole workspace at once. The `@atlas/*` and `@repo/*` packages
are linked, not published, and are consumed as TypeScript source — there's no
per-package build step.

## 2. Configure the web app

```sh
cp apps/web/.env.example apps/web/.env.local
```

Fill in the two values from **Supabase → Project Settings → API**:

| Variable                               | Value                               |
| -------------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the `sb_publishable_…` key          |

Both are public (the key is anon-equivalent; access is enforced by RLS). If a
variable is missing, `lib/supabase/env.ts` throws a clear error at startup.

`NEXT_PUBLIC_SITE_URL` is optional and only relevant to multi-hostname deploys —
see [auth.md](./auth.md).

## 3. Provision the database

Apply the migrations in `supabase/migrations/` **in order** (`0001` → `0007`) to
your project. Two easy ways:

- **Supabase SQL Editor:** paste each migration file's contents and run them in
  order, or
- **Supabase CLI:** `supabase db push` (or `supabase migration up`) against your
  linked project.

Then make yourself an admin — see [database.md](./database.md#bootstrapping-the-first-admin).

## 4. Configure Google sign-in

1. In **Supabase → Authentication → Providers**, enable **Google** and paste
   your Google OAuth client ID/secret.
2. In **Google Cloud Console**, add Supabase's callback to the OAuth client's
   **Authorized redirect URIs**:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. In **Supabase → Authentication → URL Configuration**, add
   `http://localhost:3000/**` to **Redirect URLs** and set the **Site URL**.

Details and the deployed-host variant: [auth.md](./auth.md).

## 5. Run

```sh
pnpm dev                 # everything via turbo: web on :3000, docs on :3001
pnpm --filter web dev    # just the web app
```

Other useful scripts (root):

```sh
pnpm build         # turbo run build (all)
pnpm lint          # turbo run lint
pnpm check-types   # turbo run check-types
pnpm format        # prettier --write "**/*.{ts,tsx,md}"
```

Scope to one package with `--filter`, e.g. `pnpm --filter web build`,
`pnpm --filter @atlas/tokens build:css`.

## Ports

| App      | Command                      | Port         |
| -------- | ---------------------------- | ------------ |
| `web`    | `pnpm --filter web dev`      | 3000         |
| `docs`   | `pnpm --filter docs dev`     | 3001         |
| `mobile` | `pnpm --filter mobile start` | Expo (Metro) |

## Notes on the sandbox / CI

- CI installs with `--frozen-lockfile`. **If you change a `package.json`
  dependency, run `pnpm install` and commit the updated `pnpm-lock.yaml`** in the
  same change, or the build fails with `ERR_PNPM_OUTDATED_LOCKFILE`.
- The web app is SSR (OAuth route handler + middleware), so it needs a Node/edge
  runtime — it is **not** a static export. See [deployment.md](./deployment.md).
