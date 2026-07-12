"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../supabase/client";
import type { Profile } from "../supabase/types";

interface AuthResult {
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  /** True until the initial session + profile load resolves. */
  loading: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  /** Send a magic link. `username` seeds the profile on first sign-in. */
  signInWithMagicLink: (email: string, username?: string) => Promise<AuthResult>;
  /** Sign in with an email + password (no email sent — never rate-limited). */
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  /** Set/change the current user's password. Requires an active session. */
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function callbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

// After an OAuth redirect that lands on a page other than /auth/callback (some
// hosts drop the code at the site root instead), the browser client still
// exchanges the `?code=` in place — but the spent code lingers in the URL.
// Strip it (and any error params) once the client has had its chance to consume
// it, so the address bar is clean and a refresh can't re-submit a dead code.
// MUST run only after the exchange (see call sites), never before.
function stripAuthParams() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of ["code", "error", "error_code", "error_description", "auth_error"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash,
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Guards against a slow profile fetch resolving after a newer auth change.
  const reqRef = useRef(0);

  const loadProfile = useCallback(
    async (u: User | null) => {
      const req = ++reqRef.current;
      if (!u) {
        if (req === reqRef.current) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();
      if (req === reqRef.current) setProfile((data as Profile) ?? null);
    },
    [supabase],
  );

  useEffect(() => {
    let alive = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!alive) return;
        setUser(data.user);
        return loadProfile(data.user);
      })
      .catch(() => {
        // Network/offline (or the host isn't allowlisted yet) — treat as
        // signed-out rather than hanging on the loading state.
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        // getUser() awaits the client's init, which runs the in-URL code
        // exchange — so by here the code is spent and safe to remove.
        stripAuthParams();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      loadProfile(nextUser);
      // A fresh sign-in that resolved after initial load — clean its params too.
      if (event === "SIGNED_IN") stripAuthParams();
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const signInWithMagicLink = useCallback(
    async (email: string, username?: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl(),
          data: username ? { username } : undefined,
        },
      });
      return error ? { error: error.message } : {};
    },
    [supabase],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return error ? { error: error.message } : {};
    },
    [supabase],
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    return error ? { error: error.message } : {};
  }, [supabase]);

  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.updateUser({ password });
      return error ? { error: error.message } : {};
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const refreshProfile = useCallback(() => loadProfile(user), [loadProfile, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isGuest: !!user && (user.is_anonymous ?? profile?.is_guest ?? false),
      isAdmin: profile?.role === "admin",
      signInWithMagicLink,
      signInWithPassword,
      signInWithGoogle,
      updatePassword,
      signOut,
      refreshProfile,
    }),
    [
      user,
      profile,
      loading,
      signInWithMagicLink,
      signInWithPassword,
      signInWithGoogle,
      updatePassword,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
