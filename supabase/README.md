# Supabase

Database schema and auth backend for Atlas v3.

## Applying migrations

**Option A — Supabase CLI (recommended, reproducible):**

```bash
npm i -g supabase           # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref wcbvflbvetqpxsxdvack
supabase db push            # applies everything in migrations/ in order
```

**Option B — SQL editor:** paste each file in `migrations/` (in filename order)
into the Supabase dashboard SQL editor and run it.

## Dashboard settings (not captured in SQL)

Auth providers are configured in the dashboard, not migrations:

1. **Authentication → Providers → Email** — enable, keep "Confirm email" on. This
   powers magic-link (OTP) sign-in.
2. **Authentication → Providers → Google** — enable and paste a Google Cloud
   OAuth client ID/secret. Add the callback URL Supabase shows you to the Google
   client's authorized redirect URIs.
3. **Authentication → Providers → Anonymous** — enable (powers "play as guest").
4. **Authentication → URL Configuration** — add the app's origin (e.g.
   `http://localhost:3000` and the deployed URL) to **Redirect URLs** so
   magic-link / OAuth returns land back in the app.

## Making yourself an admin

After signing in once (so your `profiles` row exists), run in the **SQL editor**:

```sql
update public.profiles set role = 'admin' where username = '<your-username>';
```

This works because the SQL editor runs as a privileged role with no
`auth.uid()`, so the `prevent_role_change` trigger lets it through — end-users
still can't promote themselves. Sign out and back in afterwards so the app
re-reads your profile. The `/admin` routes check `role = 'admin'`.
