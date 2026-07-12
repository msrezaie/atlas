import type { NextRequest } from "next/server";
import { updateSession } from "./app/lib/supabase/middleware";

// Next 16 renamed the root "middleware" convention to "proxy" (same behaviour:
// runs before matched requests). The Supabase session-refresh + /admin gate
// live in updateSession.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except Next internals and static assets, so the session
  // cookie stays fresh across the whole app (and /admin stays gated).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
