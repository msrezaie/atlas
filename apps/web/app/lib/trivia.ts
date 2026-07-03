import type { Country, Region } from "@atlas/types";
import { COUNTRIES, getCountryFacts } from "@atlas/data";
import { shuffle } from "@atlas/game-logic";

export interface TriviaChoice {
  iso2: string;
  name: string;
}

export interface TriviaQuestion {
  prompt: string;
  answerIso2: string;
  choices: TriviaChoice[];
}

function filterRegionAll(region: Region): Country[] {
  return region === "World"
    ? COUNTRIES
    : COUNTRIES.filter((c) => c.continent === region);
}

// `pick` is only ever called with a subset of length >= 2 (checked at the
// call site), so the post-sort index-0 access is always safe.
const SUPERLATIVES: { q: string; pick: (a: Country[]) => Country }[] = [
  {
    q: "has the largest population?",
    pick: (a) => [...a].sort((x, y) => y.population - x.population)[0]!,
  },
  {
    q: "has the smallest population?",
    pick: (a) => [...a].sort((x, y) => x.population - y.population)[0]!,
  },
  {
    q: "has the largest land area?",
    pick: (a) => [...a].sort((x, y) => y.area - x.area)[0]!,
  },
  {
    q: "has the smallest land area?",
    pick: (a) => [...a].sort((x, y) => x.area - y.area)[0]!,
  },
];

/**
 * Simulated "AI" trivia generator — derives superlative / capital / language
 * questions from the country dataset so Geo Trivia is fully playable without
 * a live model. In production, swap this for real model-generated questions;
 * the call site (TriviaScreen) only needs `TriviaQuestion[]` back.
 */
export function genTrivia(region: Region, n: number): TriviaQuestion[] {
  const pool = filterRegionAll(region);
  const out: TriviaQuestion[] = [];
  const used = new Set<string>();
  let guard = 0;

  while (out.length < n && guard++ < 400) {
    const roll = Math.random();
    let answer: Country;
    let prompt: string;
    let choices: Country[];

    if (roll < 0.4) {
      const subset = shuffle(pool).slice(0, 4);
      if (subset.length < 2) continue;
      const t = SUPERLATIVES[(Math.random() * SUPERLATIVES.length) | 0]!;
      answer = t.pick(subset);
      prompt = t.q;
      choices = subset;
    } else {
      const c = shuffle(pool)[0];
      if (!c) continue;
      const useCapital = roll < 0.7;
      const lang = getCountryFacts(c.iso2).language.split(",")[0];
      prompt = useCapital
        ? `has ${c.capital} as its capital?`
        : `has ${lang} as an official language?`;
      answer = c;
      choices = shuffle([
        c,
        ...shuffle(pool.filter((p) => p.iso2 !== c.iso2)).slice(0, 3),
      ]);
    }

    const key = prompt + "|" + answer.iso2;
    if (used.has(key) || choices.length < 2) continue;
    used.add(key);
    out.push({
      prompt: "Which country " + prompt,
      answerIso2: answer.iso2,
      choices: shuffle(choices).map((c) => ({ iso2: c.iso2, name: c.name })),
    });
  }
  return out;
}
