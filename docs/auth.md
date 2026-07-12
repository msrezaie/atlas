# Authentication

The app uses **Supabase Auth with Google OAuth** (PKCE flow) via `@supabase/ssr`.
Sign-in is required to play 1v1 and to appear on the leaderboards.

## The clients (`apps/web/app/lib/supabase`)

`@supabase/ssr` gives three clients that share the session through cookies:

| Client     | File                                                     | Used in                                   |
| ---------- | -------------------------------------------------------- | ----------------------------------------- |
| Browser    | `client.ts` (`createBrowserClient`)                      | Client components (`AuthProvider`, hooks) |
| Server     | `server.ts` (`createServerClient` + `next/headers`)      | Route handlers, server components         |
| Middleware | `middleware.ts` (`createServerClient` + request cookies) | `proxy.ts`                                |

`AuthProvider` (`lib/auth/AuthProvider.tsx`) wraps the app, exposes the session
and `signInWithGoogle`, and reacts to `onAuthStateChange`.

## The sign-in flow

1. `signInWithGoogle()` calls `supabase.auth.signInWithOAuth({ provider: 'google',
options: { redirectTo: <origin>/auth/callback } })`. The browser client stores
   a PKCE **code-verifier** in a cookie.
2. The browser goes to Google → back to **Supabase**
   (`/auth/v1/callback`) → Supabase redirects to the app's `redirectTo` with a
   one-time `?code=`.
3. The code is exchanged for a session (`exchangeCodeForSession`), which sets the
   session cookies. `AuthProvider` then sees the signed-in user.

`proxy.ts` refreshes the session cookie on every request and gates `/admin/**`.

## Google / Supabase configuration

Google only ever redirects to **Supabase**, never to the app, so the app's domain
is not configured in Google:

- **Google Cloud → OAuth client → Authorized redirect URIs:**
  `https://<project-ref>.supabase.co/auth/v1/callback`
- **Supabase → Authentication → URL Configuration:**
  - **Site URL:** your canonical app origin (e.g. `http://localhost:3000` in dev,
    `https://atlas-guesser.netlify.app` in staging).
  - **Redirect URLs:** allowlist the app callback, e.g.
    `http://localhost:3000/**` and `https://atlas-guesser.netlify.app/**`.

## Multi-hostname hosts (the Netlify gotcha)

On hosts that serve the same deploy under multiple hostnames — e.g. Netlify's
primary alias `atlas-guesser.netlify.app` **and** per-deploy permalinks like
`<hash>--atlas-guesser.netlify.app` — OAuth can break in a subtle way:

> The PKCE **code-verifier cookie is host-scoped**. If sign-in starts on one host
> but the code is exchanged on another, the verifier isn't sent and the exchange
> fails with _"PKCE code verifier not found in storage"_ (`status 400`).

This is why the app currently relies on the **browser client** to exchange the
code (it happens in-page, on the same host that set the verifier), plus a small
URL cleanup (`stripAuthParams` in `AuthProvider`) that removes the spent
`?code=` / error params via `history.replaceState`. A server-side exchange in a
route handler/middleware is the "proper" pattern, but on Netlify it can bounce
the flow onto the permalink host and orphan the verifier — so it's deferred.

**The durable fix is a single canonical host** (a custom domain once branding is finalized). With
one hostname there's no cross-host cookie problem, and the optional
`NEXT_PUBLIC_SITE_URL` can pin redirect construction to that origin. Until then,
always test sign-in on the primary alias, not a deploy permalink.

## Admin access

`profiles.role` drives admin. The middleware revalidates the JWT with
`getUser()` (not `getSession()`, which only decodes the cookie) before allowing
`/admin/**`, so a forged cookie can't spoof it. Bootstrapping the first admin:
[database.md](./database.md#bootstrapping-the-first-admin).
