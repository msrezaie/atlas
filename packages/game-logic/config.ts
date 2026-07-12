export const TIME_LIMIT = 10; // seconds per question
export const ROUNDS = 10; // default questions per round

// Points at stake for a correct "Find the Country" answer, by seconds remaining.
// The stake stays full for the first couple of seconds — enough time to zoom and
// pan to a small country — then steps down. Kept here as a first step toward
// admin-configurable scoring (v3.5).
export const MAX_POINTS = 4;

// [minSecondsRemaining, points], highest threshold first. Evaluated against the
// (fractional) time left, so 7.9s still scores 3, 8.0s scores 4, etc.
export const SCORE_STEPS: readonly (readonly [number, number])[] = [
  [6, 4], // 10.0–6.0s → 4
  [4, 3], //  5.9–4.0s → 3
  [2, 2], //  3.9–4.0s → 2
  [0, 1], //  1.9–0.0s → 1
];

/** Points a correct answer is worth right now, given the (fractional) time left. */
export function pointsForTime(timeLeft: number): number {
  for (const [threshold, pts] of SCORE_STEPS) {
    if (timeLeft >= threshold) return pts;
  }
  return 1;
}
