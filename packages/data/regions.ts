import type { Continent, Region } from "../types";

export const REGIONS: Region[] = [
  "World",
  "Asia",
  "Africa",
  "Americas",
  "Europe",
  "Oceania",
];

export const REGION_VIEW: Record<Region, {
  center: [number, number];
  zoom: number;
  minZoom: number;
}> = {
  World:    { center: [0, 15],    zoom: 1,   minZoom: 1   },
  Americas: { center: [-80, 5],   zoom: 1.8, minZoom: 1.8 },
  Europe:   { center: [20, 55],   zoom: 5,   minZoom: 5   },
  Africa:   { center: [22, 2],    zoom: 3,   minZoom: 3   },
  Asia:     { center: [95, 30],   zoom: 2,   minZoom: 2   },
  Oceania:  { center: [155, -25], zoom: 3.5, minZoom: 3.5 },
};

export const CONTINENT_COLOR: Record<Continent, {
  base: string;
  hover: string;
  border: string;
}> = {
  Americas: { base: "#7c4a1e", hover: "#9c5e26", border: "rgba(255,180,100,0.45)" },
  Europe:   { base: "#1e4a7c", hover: "#265e9c", border: "rgba(100,160,255,0.45)" },
  Africa:   { base: "#1e6e3a", hover: "#268a4a", border: "rgba(80,200,120,0.45)"  },
  Asia:     { base: "#6e1e3a", hover: "#8a264a", border: "rgba(220,100,140,0.45)" },
  Oceania:  { base: "#3a1e7c", hover: "#4a2696", border: "rgba(140,100,255,0.45)" },
};
