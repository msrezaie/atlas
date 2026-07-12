import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

/**
 * Refreshes the Supabase session on every request (rotating cookies) and, for
 * `/admin/**`, enforces that the caller is an admin — redirecting everyone else
 * back to the app. Returns the response the root middleware should hand back.
 *
 * `getUser()` (not `getSession()`) is used deliberately: it revalidates the JWT
 * with the auth server, so the admin check can't be spoofed by a forged cookie.
 */
export async function updateSession(request: NextRequest) {
  // OAuth landing safety net. The app always asks Supabase to return to
  // /auth/callback, but some hosts (seen on Netlify) drop the `?code=` on the
  // site root instead. Funnel any stray code into the callback route so it's
  // always exchanged server-side and the URL ends up clean — wherever it lands.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.searchParams.set("next", request.nextUrl.pathname);
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}
