import { getSupabaseBrowserClient } from "./supabase/client";
import type { RoundConfig } from "./gameMode";

/**
 * Persist a completed run to the `scores` table. RLS requires `user_id` to match
 * the caller, so we pass the current user's id. Fire-and-forget from the UI;
 * returns an error string on failure (e.g. offline) so callers can fall back to
 * localStorage without blocking the results screen.
 */
export async function saveScore(
  cfg: RoundConfig,
  score: number,
  userId: string,
  opts?: { won?: boolean; oppScore?: number; durationMs?: number },
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("scores").insert({
    user_id: userId,
    mode: cfg.mode,
    play: cfg.play,
    region: cfg.region,
    score,
    round_len: cfg.roundLen,
    won: opts?.won ?? null,
    opp_score: opts?.oppScore ?? null,
    duration_ms: opts?.durationMs ?? null,
  });
  return error?.message ?? null;
}
