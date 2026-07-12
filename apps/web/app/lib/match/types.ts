// A resolved 1v1 match — either a real paired opponent or a bot fallback.
export interface MatchInfo {
  /** matches.id for real matches; "bot" for the fallback. */
  matchId: string;
  isBot: boolean;
  opponentName: string;
  /** profiles.id of the opponent; null for a bot. */
  opponentId: string | null;
  /** Shared seed → both clients generate the same question order. */
  seed: number | string;
  /** player_a is the host: it resolves each round and broadcasts the outcome.
   *  Always true for a bot match (you're the sole authority). */
  amHost: boolean;
}
