import type { Country, Region } from "@atlas/types";
import { COUNTRIES } from "@atlas/data";
import { shuffle } from "@atlas/game-logic";

export interface FlagChoice {
  iso2: string;
  name: string;
}

export type FlagQuestionKind = "mc" | "typed";

export interface FlagQuestion {
  kind: FlagQuestionKind;
  answerIso2: string;
  answerName: string;
  /** Populated for "mc" only — the 2-4 flags shown to pick from. */
  choices: FlagChoice[];
}

function filterRegionAll(region: Region): Country[] {
  return region === "World"
    ? COUNTRIES
    : COUNTRIES.filter((c) => c.continent === region);
}

// Common short forms players are likely to type instead of the full name.
const ALIASES: Record<string, string> = {
  usa: "united states",
  us: "united states",
  "united states of america": "united states",
  america: "united states",
  uk: "united kingdom",
  britain: "united kingdom",
  "great britain": "united kingdom",
  uae: "united arab emirates",
  drc: "democratic republic of the congo",
  "ivory coast": "cote d ivoire",
};

export function normalizeGuess(s: string): string {
  const base = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return ALIASES[base] ?? base;
}

export function checkTypedAnswer(guess: string, country: Country): boolean {
  if (!guess.trim()) return false;
  return normalizeGuess(guess) === normalizeGuess(country.name);
}

/**
 * Simulated "AI" flag round — mixes multiple-choice ("which flag is X?")
 * and, when `allowTyped`, free-typed ("name this flag") questions. 1v1
 * keeps `allowTyped` false: typing introduces a fairness/speed skew a
 * race format shouldn't have, so versus stays multiple-choice only.
 */
export function genFlagQuestions(
  region: Region,
  n: number,
  allowTyped: boolean,
): FlagQuestion[] {
  const pool = filterRegionAll(region);
  const out: FlagQuestion[] = [];
  const used = new Set<string>();
  let guard = 0;

  while (out.length < n && guard++ < 400) {
    const c = shuffle(pool)[0];
    if (!c || used.has(c.iso2)) continue;

    if (allowTyped && Math.random() < 0.45) {
      used.add(c.iso2);
      out.push({ kind: "typed", answerIso2: c.iso2, answerName: c.name, choices: [] });
      continue;
    }

    const distractors = shuffle(pool.filter((p) => p.iso2 !== c.iso2)).slice(0, 3);
    const choices = shuffle([c, ...distractors]);
    if (choices.length < 2) continue;
    used.add(c.iso2);
    out.push({
      kind: "mc",
      answerIso2: c.iso2,
      answerName: c.name,
      choices: choices.map((x) => ({ iso2: x.iso2, name: x.name })),
    });
  }
  return out;
}
