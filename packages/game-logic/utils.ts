import type { Country, Region } from "../types";
import { COUNTRIES } from "../data/countries";
import { MAP_EXCLUDED, NUM_TO_ISO2 } from "../data/map";

// Pre-computed set of iso2 codes that have a topojson polygon
const MAP_ISO2S = new Set(Object.values(NUM_TO_ISO2));

export const shuffle = <T,>(arr: T[]): T[] =>
  [...arr].sort(() => Math.random() - 0.5);

/** Returns countries valid for a region, filtered to only those that are
 *  clickable on the map (have a topojson entry and are not excluded). */
export const filterRegion = (region: Region): Country[] => {
  const base =
    region === "World"
      ? COUNTRIES
      : COUNTRIES.filter((c) => c.continent === region);

  return base.filter(
    (c) => MAP_ISO2S.has(c.iso2) && !MAP_EXCLUDED.has(c.iso2)
  );
};
