// Deterministic RNG + shuffle so both players in a 1v1 match generate the exact
// same question order from the match's shared seed.

/** mulberry32 — a small, fast, seedable PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Reduce a match seed (bigint / string / number) to a stable 32-bit int. */
export function seedTo32(seed: number | string | bigint): number {
  try {
    return Number(BigInt(seed) % 4294967296n) >>> 0;
  } catch {
    return 0;
  }
}

/** Fisher–Yates shuffle driven by the seed — identical output for equal seeds. */
export function seededShuffle<T>(arr: readonly T[], seed: number | string | bigint): T[] {
  const rng = mulberry32(seedTo32(seed));
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}
