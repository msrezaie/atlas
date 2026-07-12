// Matchmaking tunables, isolated here so they can be wired to the admin config
// later (v3.5). Times in milliseconds.

/** Earliest the bot fallback can trigger while searching for a human. */
export const MATCH_SEARCH_MIN_MS = 5000;
/** By this point, if no human has been matched, pair the player with a bot. */
export const MATCH_SEARCH_MAX_MS = 9000;
/** "Opponent found" reveal beat before the match actually starts. */
export const MATCH_REVEAL_MS = 1600;
