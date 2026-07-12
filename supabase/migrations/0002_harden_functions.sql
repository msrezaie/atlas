-- Security hardening — addresses Supabase advisors 0028/0029 (SECURITY DEFINER
-- functions callable over PostgREST RPC).

-- is_admin(): `profiles` is world-readable (it feeds the leaderboard), so any
-- caller can already read their own role. That means SECURITY INVOKER is enough
-- here — it drops the SECURITY DEFINER exposure entirely while behaving the same
-- (auth.uid() comes from the request JWT regardless of the executing role).
create or replace function public.is_admin()
returns boolean
language sql
security invoker
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- The trigger functions are only ever invoked by their triggers, never called
-- directly — so remove their RPC EXECUTE grant. Triggers still fire normally;
-- trigger invocation doesn't check the invoking role's EXECUTE privilege.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prevent_role_change() from public, anon, authenticated;
