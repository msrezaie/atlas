"use client";

import { getSupabaseBrowserClient } from "./supabase/client";

// Reads the `player_stats` view (migrations 0003/0004). The view is
// world-readable (security_invoker over the public profiles/scores), so a
// browser-client read works for signed-in players and guests alike.

export interface LeaderboardRow {
  user_id: string;
  username: string;
  solo_xp: number;
  versus_wins: number;
  versus_games: number;
  solo_games: number;
  timed_solo_games: number;
  best_find: number;
  best_trivia: number;
  best_flag: number;
  /** Fastest average ms/question across timed solo runs; null if none. */
  best_avg_ms: number | null;
  total_xp: number;
  [key: string]: unknown;
}

export type LeaderMetric = "solo_xp" | "versus_wins" | "total_xp" | "best_avg_ms";
export type FilterCol = "solo_games" | "versus_games" | "timed_solo_games";

const COLS =
  "user_id, username, solo_xp, versus_wins, versus_games, solo_games, timed_solo_games, best_find, best_trivia, best_flag, best_avg_ms, total_xp";

/**
 * Top players by `metric`, restricted to those who've actually played the
 * relevant mode (`filterCol > 0`). `ascending` is for "fastest" (lower is
 * better); default is highest-first.
 */
export async function fetchLeaderboard(
  metric: LeaderMetric,
  filterCol: FilterCol,
  opts?: { ascending?: boolean; limit?: number },
): Promise<LeaderboardRow[]> {
  const { ascending = false, limit = 8 } = opts ?? {};
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("player_stats")
    .select(COLS)
    .gt(filterCol, 0)
    .order(metric, { ascending, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}
