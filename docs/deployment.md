# Deployment

The web app (`apps/web`) is deployed to **Netlify** (staging:
`https://atlas-guesser.netlify.app`). It's a true SSR Next.js app (OAuth route
handler + `proxy.ts` middleware), so it needs a Node/edge runtime — **not** a
static export.

## Netlify

The site is a monorepo build scoped to `apps/web`. The build config can live in
the Netlify UI or in a repo-root `netlify.toml`:

```toml
[build]
  base = "apps/web"
  command = "pnpm --filter web build"

[build.environment]
  NODE_VERSION = "22"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Notes:

- `base = "apps/web"` scopes the build, but pnpm still installs the **whole
  workspace** (it walks up to `pnpm-workspace.yaml`), so `@atlas/*` resolve.
- A `netlify.toml` **overrides** the UI build settings — keep them in sync.
- The Next.js runtime plugin serves SSR, the `/auth/callback` route handler, and
  the middleware.

### Environment variables (Netlify UI)

Set for Production **and** Preview:

| Variable                               | Value                               |
| -------------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…`                  |

No service-role secret is needed (access is via RLS).

### Lockfile

CI installs with `--frozen-lockfile`. If a `package.json` dependency changed,
commit the updated `pnpm-lock.yaml` in the same change, or the build fails with
`ERR_PNPM_OUTDATED_LOCKFILE`.

## Supabase auth wiring (per host)

After deploying, point Supabase at the deployed origin
(**Authentication → URL Configuration**):

- **Site URL:** `https://atlas-guesser.netlify.app`
- **Redirect URLs:** `https://atlas-guesser.netlify.app/**` (keep
  `http://localhost:3000/**` for local dev). For preview deploys, also add the
  preview pattern, e.g. `https://deploy-preview-*--atlas-guesser.netlify.app/**`.

**Google Cloud** needs no per-deploy change — its only redirect URI is Supabase's
callback (`https://<project-ref>.supabase.co/auth/v1/callback`).

See [auth.md](./auth.md) for the multi-hostname (deploy-permalink) caveat and why
sign-in should be tested on the primary alias.

## Custom domain

When branding lands, add the domain in **Netlify → Domain management**, then
update the Supabase **Site URL** + **Redirect URLs** to it. A single canonical
host also resolves the OAuth permalink caveat in [auth.md](./auth.md). No code
changes required.

## Alternatives

Any Node/edge host that runs Next 16 SSR works. Vercel is the most seamless
(day-zero Next support, per-PR previews); Netlify is the close free-tier
equivalent (used here). Cloudflare/OpenNext can lag new Next releases; Render's
free tier sleeps; Railway/Fly no longer have a true free tier. Container
self-hosting works with `output: "standalone"` (not needed for Netlify/Vercel).
