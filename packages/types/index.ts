export type Continent = "Africa" | "Americas" | "Asia" | "Europe" | "Oceania";
export type Region = "World" | Continent;
export type MapState = "neutral" | "correct" | "incorrect" | "found" | "missed";
export type Screen = "home" | "find-country" | "results";

export interface Country {
  iso2: string;
  name: string;
  continent: Continent;
  capital: string;
  population: number;
  area: number;
  lat: number;
  lng: number;
}

export interface RoundResult {
  score: number;
  longestStreak: number;
  correct: number;
  total: number;
}
