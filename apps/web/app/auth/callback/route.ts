import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../lib/supabase/server";

/**
 * OAuth / magic-link landing. Supabase (PKCE) sends the user here with a `code`;
 * we exchange it for a session (setting cookies) and bounce back into the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
