"use client";

import { getSupabaseBrowserClient } from "../../lib/supabase/client";

// Live admin data derived from the public `profiles` + `scores` tables. RLS
// makes both world-readable (they feed the leaderboard), and the /admin route is
// server-gated to admins — so a plain browser-client read is enough here.
// Aggregation is done in-app to avoid adding DB objects; if the tables grow
// large this should move to a materialized view or an admin RPC.

export interface AdminUserRow {
  id: string;
  username: string;
  role: "player" | "admin";
  isGuest: boolean;
  country: string | null;
  games: number;
  best: number;
  joined: string;
  lastPlayed: string | null;
  // DataTable's row type is indexable.
  [key: string]: unknown;
}

interface ScoreLite {
  user_id: string;
  score: number;
  created_at: string;
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const sb = getSupabaseBrowserClient();
  const [profilesRes, scoresRes] = await Promise.all([
    sb.from("profiles").select("id, username, role, is_guest, country, created_at"),
    sb.from("scores").select("user_id, score, created_at"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (scoresRes.error) throw scoresRes.error;

  const agg = new Map<string, { games: number; best: number; last: string | null }>();
  for (const s of (scoresRes.data ?? []) as ScoreLite[]) {
    const a = agg.get(s.user_id) ?? { games: 0, best: 0, last: null };
    a.games += 1;
    a.best = Math.max(a.best, s.score);
    if (!a.last || s.created_at > a.last) a.last = s.created_at;
    agg.set(s.user_id, a);
  }

  return ((profilesRes.data ?? []) as Record<string, unknown>[])
    .map((p): AdminUserRow => {
      const a = agg.get(p.id as string);
      return {
        id: p.id as string,
        username: p.username as string,
        role: p.role as "player" | "admin",
        isGuest: Boolean(p.is_guest),
        country: (p.country as string) ?? null,
        games: a?.games ?? 0,
        best: a?.best ?? 0,
        joined: p.created_at as string,
        lastPlayed: a?.last ?? null,
      };
    })
    .sort((a, b) => b.games - a.games || a.username.localeCompare(b.username));
}

export interface RecentPlay {
  username: string;
  score: number;
  mode: string;
  when: string;
}

export interface OverviewStats {
  totalUsers: number;
  gamesTotal: number;
  gamesToday: number;
  topScore: number;
  series: { label: string; games: number }[];
  recent: RecentPlay[];
}

const DAY_MS = 86_400_000;

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const sb = getSupabaseBrowserClient();
  const [usersRes, scoresRes, recentRes] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("scores").select("score, created_at"),
    sb
      .from("scores")
      .select("score, mode, created_at, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  if (scoresRes.error) throw scoresRes.error;

  const scores = (scoresRes.data ?? []) as { score: number; created_at: string }[];

  // 14-day buckets, oldest → newest, keyed by local date.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: { label: string; games: number; key: string }[] = [];
  const keyOf = (d: Date) => d.toISOString().slice(0, 10);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    buckets.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      games: 0,
      key: keyOf(d),
    });
  }
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

  let gamesToday = 0;
  let topScore = 0;
  const todayKey = keyOf(today);
  for (const s of scores) {
    const key = keyOf(new Date(s.created_at));
    const bucket = bucketByKey.get(key);
    if (bucket) bucket.games += 1;
    if (key === todayKey) gamesToday += 1;
    if (s.score > topScore) topScore = s.score;
  }

  const recent: RecentPlay[] = (
    (recentRes.data ?? []) as {
      score: number;
      mode: string;
      created_at: string;
      profiles: { username: string } | { username: string }[] | null;
    }[]
  ).map((r) => {
    const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      username: prof?.username ?? "Someone",
      score: r.score,
      mode: r.mode,
      when: r.created_at,
    };
  });

  return {
    totalUsers: usersRes.count ?? 0,
    gamesTotal: scores.length,
    gamesToday,
    topScore,
    series: buckets.map(({ label, games }) => ({ label, games })),
    recent,
  };
}
