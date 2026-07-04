import maplibregl from "maplibre-gl";
import { GEO_URL, NUM_TO_ISO2, LOCATOR_DOTS, COUNTRIES } from "@atlas/data";
import { WATER, buildWavePattern } from "./mapVisuals";

// Shared plumbing for the app's two flat-GeoJSON MapLibre maps — the Find the
// Country game map (WorldMapGame) and the Explore Countries map (LearningMap).
// Both fetch the same GeoJSON, draw it over the same procedural-wave ocean, and
// dismiss their loader on the same signal; only their paint expressions and
// click/hover semantics differ, so those stay in the components.

// Deferred, module-cached fetch. Module-level (not per-mount) so revisiting a
// map reuses the parsed result; deferred to first call so it never runs during
// SSR, where Node rejects the relative URL.
let geoPromise: Promise<GeoJSON.FeatureCollection> | null = null;
export const loadGeo = () =>
  (geoPromise ??= fetch(GEO_URL)
    .then((r) => r.json() as Promise<GeoJSON.FeatureCollection>)
    .catch((err) => {
      console.error("Failed to load geojson", err);
      geoPromise = null;
      throw err;
    }));

// iso2 → numeric feature id (inverse of the dataset's NUM_TO_ISO2).
export const ISO2_TO_NUM: Record<string, number> = Object.fromEntries(
  Object.entries(NUM_TO_ISO2).map(([num, iso2]) => [iso2, parseInt(num)]),
);

export interface MapView {
  center: [number, number];
  zoom: number;
  minZoom: number;
}

// Flat ocean background; countries are drawn as GeoJSON on top — no tile source.
const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    { id: "background", type: "background", paint: { "background-color": WATER } },
  ],
};

// Swap the flat ocean colour for the procedural wave texture (a background
// pattern replaces background-color, so the base tone is baked into the tile).
export function installWaterPattern(map: maplibregl.Map) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (!map.hasImage("water-waves")) {
    map.addImage("water-waves", buildWavePattern(dpr), { pixelRatio: dpr });
  }
  map.setPaintProperty("background", "background-pattern", "water-waves");
}

/**
 * Fire `onReady` once `sourceId` has loaded, on whichever reliable signal lands
 * first:
 *   • `idle` — the map has actually painted and settled (the ideal "displayed"
 *     signal), but under software-WebGL renderers the map can churn and never
 *     reach idle, so it can't be the only trigger.
 *   • `sourcedata` + `isSourceLoaded` — the GeoJSON finished parsing; fires
 *     regardless of render settling, but ~a frame before paint (callers cover
 *     that with a short fade).
 * Both are persistent (not `once`) and registered up front, so a slow cold
 * fetch can't cause us to attach too late and miss the event.
 */
export function watchMapReady(
  map: maplibregl.Map,
  sourceId: string,
  onReady: () => void,
) {
  const markReady = () => {
    if (!map.getSource(sourceId)) return;
    onReady();
    map.off("idle", markReady);
    map.off("sourcedata", onSourceData);
  };
  const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
    if (e.sourceId === sourceId && e.isSourceLoaded) markReady();
  };
  map.on("idle", markReady);
  map.on("sourcedata", onSourceData);
}

// Authoritative point per country from the dataset. We deliberately do NOT
// derive dot positions from the GeoJSON via d3's geoCentroid: this dataset's
// ring winding reads as inverted to d3-geo's spherical algorithms, so
// geoCentroid returns the *antipode* of each country. The dataset's own
// lng/lat is correct and simpler.
const DOT_POINT = new Map<string, [number, number]>(
  COUNTRIES.map((c) => [c.iso2, [c.lng, c.lat]]),
);

/**
 * Locator-dot features for the small countries that are hard to click at world
 * zoom. Each dot keeps the same numeric id as its polygon, so `setFeatureState`
 * stays in sync across the two sources.
 */
export function buildDotFeatures(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const iso2 of LOCATOR_DOTS) {
    const numId = ISO2_TO_NUM[iso2];
    const pt = DOT_POINT.get(iso2);
    if (numId == null || !pt) continue;
    features.push({
      type: "Feature",
      id: numId,
      properties: { iso2 },
      geometry: { type: "Point", coordinates: pt },
    });
  }
  return { type: "FeatureCollection", features };
}

/**
 * A lng/lat bounding box in a *continuous* longitude frame — `east` may exceed
 * 180 (or `west` drop below -180) for features that cross the antimeridian, so
 * the box stays a single contiguous span suitable for `map.fitBounds`.
 */
export interface LngLatBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

// Bounding box of one polygon's outer ring. We can't use d3's spherical
// `geoBounds` — this dataset's ring winding reads as inverted to it, so it
// returns the whole sphere. To stay antimeridian-safe we track two longitude
// frames (raw, and one with negative lngs shifted +360 to un-split a ring
// straddling ±180) and keep whichever gives the narrower east-west span.
function ringBox(ring: GeoJSON.Position[]): LngLatBox | null {
  let w1 = 180,
    e1 = -180,
    w2 = Infinity,
    e2 = -Infinity,
    s = 90,
    n = -90;
  let seen = false;
  for (const p of ring) {
    const x = p[0];
    const y = p[1];
    if (typeof x !== "number" || typeof y !== "number") continue;
    seen = true;
    if (x < w1) w1 = x;
    if (x > e1) e1 = x;
    const xs = x < 0 ? x + 360 : x;
    if (xs < w2) w2 = xs;
    if (xs > e2) e2 = xs;
    if (y < s) s = y;
    if (y > n) n = y;
  }
  if (!seen) return null;
  return e1 - w1 <= e2 - w2
    ? { west: w1, south: s, east: e1, north: n }
    : { west: w2, south: s, east: e2, north: n };
}

const boxArea = (b: LngLatBox) => (b.east - b.west) * (b.north - b.south);

/**
 * Bounding box of a country's *main landmass cluster*. A country's geometry
 * can include far-flung tiny territories (Australia's Macquarie & Heard
 * Islands, France's overseas départements…) that would balloon a naive
 * whole-geometry box and push the fit out to empty ocean. So we box each
 * constituent polygon, take the largest, and union only the polygons whose
 * centre falls within a padded version of it — keeping nearby parts (Tasmania)
 * while dropping the distant specks.
 */
/** Outer-ring boxes for every polygon in a geometry. */
function geomRingBoxes(geom: GeoJSON.Geometry): LngLatBox[] {
  const rings: GeoJSON.Position[][] = [];
  if (geom.type === "Polygon") rings.push(geom.coordinates[0]!);
  else if (geom.type === "MultiPolygon")
    for (const poly of geom.coordinates) rings.push(poly[0]!);
  return rings
    .map(ringBox)
    .filter((b): b is LngLatBox => b !== null);
}

/**
 * The main-landmass box from a set of per-polygon boxes: take the largest, then
 * union only the boxes whose centre falls within a padded version of it —
 * keeping nearby parts (Tasmania) while dropping distant specks (Macquarie I.).
 */
function clusterBox(boxes: LngLatBox[]): LngLatBox | null {
  if (!boxes.length) return null;
  let largest = boxes[0]!;
  for (const b of boxes) if (boxArea(b) > boxArea(largest)) largest = b;

  const padX = Math.max((largest.east - largest.west) * 0.3, 1);
  const padY = Math.max((largest.north - largest.south) * 0.3, 1);
  const near = {
    west: largest.west - padX,
    east: largest.east + padX,
    south: largest.south - padY,
    north: largest.north + padY,
  };
  const kept = boxes.filter((b) => {
    const cx = (b.west + b.east) / 2;
    const cy = (b.south + b.north) / 2;
    return cx >= near.west && cx <= near.east && cy >= near.south && cy <= near.north;
  });
  return mergeBoxes(kept.length ? kept : [largest]);
}

/**
 * Per-country bounding boxes, keyed by numeric feature id. A country can span
 * multiple features that share the same id (e.g. Australia and its separate
 * Ashmore & Cartier Islands feature), so we gather every polygon across all of
 * them before picking the main-landmass cluster — otherwise a later tiny-islet
 * feature would overwrite the mainland's box.
 */
export function featureBoxes(
  geojson: GeoJSON.FeatureCollection,
): Map<number, LngLatBox> {
  const perId = new Map<number, LngLatBox[]>();
  for (const f of geojson.features) {
    const numId = Number(f.id);
    if (!NUM_TO_ISO2[numId] || !f.geometry) continue;
    const arr = perId.get(numId) ?? [];
    arr.push(...geomRingBoxes(f.geometry));
    perId.set(numId, arr);
  }
  const out = new Map<number, LngLatBox>();
  for (const [numId, boxes] of perId) {
    const box = clusterBox(boxes);
    if (box) out.set(numId, box);
  }
  return out;
}

/**
 * Union several boxes into one, shifting each into the frame nearest the
 * running centre first, so a region that straddles the antimeridian (Asia with
 * Russia, Oceania with Fiji/Samoa) yields a minimal span rather than a
 * whole-globe one.
 */
export function mergeBoxes(boxes: LngLatBox[]): LngLatBox | null {
  let acc: LngLatBox | null = null;
  for (const b of boxes) {
    if (!acc) {
      acc = { ...b };
      continue;
    }
    let west = b.west;
    let east = b.east;
    const accCenter = (acc.west + acc.east) / 2;
    while ((west + east) / 2 - accCenter > 180) {
      west -= 360;
      east -= 360;
    }
    while (accCenter - (west + east) / 2 > 180) {
      west += 360;
      east += 360;
    }
    acc.west = Math.min(acc.west, west);
    acc.east = Math.max(acc.east, east);
    acc.south = Math.min(acc.south, b.south);
    acc.north = Math.max(acc.north, b.north);
  }
  return acc;
}

/** Box → the `[[w, s], [e, n]]` tuple MapLibre's `fitBounds` expects. */
export function boxBounds(
  box: LngLatBox,
): [[number, number], [number, number]] {
  return [
    [box.west, box.south],
    [box.east, box.north],
  ];
}

/**
 * Create the map and wire the shared load sequence — water pattern → fetch →
 * add the `countries` source → hand off to the caller for map-specific layers —
 * plus the ready signal. `addLayers` is the per-map hook: add fills / borders /
 * dots and any initial feature-state there (it runs right after the source is
 * added, inside the map's `load`).
 */
export function createCountryMap(
  container: HTMLElement,
  view: MapView,
  opts: {
    onReady: () => void;
    addLayers: (
      map: maplibregl.Map,
      geojson: GeoJSON.FeatureCollection,
    ) => void;
  },
): maplibregl.Map {
  const map = new maplibregl.Map({
    container,
    style: MAP_STYLE,
    center: view.center,
    zoom: view.zoom,
    minZoom: view.minZoom,
    maxZoom: 16,
    attributionControl: false,
  });
  watchMapReady(map, "countries", opts.onReady);
  map.on("load", async () => {
    installWaterPattern(map);
    const geojson = await loadGeo();
    if (!map.getSource("countries")) {
      map.addSource("countries", { type: "geojson", data: geojson });
    }
    opts.addLayers(map, geojson);
  });
  return map;
}
