// Hand-written row types for the tables in supabase/migrations. Kept minimal;
// can be swapped for `supabase gen types typescript` output later.

export type UserRole = "player" | "admin";

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  country: string | null;
  avatar_config: unknown | null;
  is_guest: boolean;
  created_at: string;
}

export interface ScoreRow {
  id: string;
  user_id: string;
  mode: "find" | "trivia" | "flag";
  play: "solo" | "versus";
  region: string;
  score: number;
  round_len: number;
  won: boolean | null;
  opp_score: number | null;
  duration_ms: number | null;
  created_at: string;
}
