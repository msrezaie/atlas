#!/usr/bin/env node
// Converts a world-atlas topojson file to a plain GeoJSON for use in MapLibre.
// Run: node scripts/build-geo.mjs
// Output: apps/web/public/countries.geojson

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { feature } = require("topojson-client");
const rewind      = require("@mapbox/geojson-rewind");
const pc          = require("polygon-clipping");

const root   = join(dirname(fileURLToPath(import.meta.url)), "..");
const input  = join(root, "public/countries-10m.json");
const output = join(root, "public/countries-10m.geojson");

// ── antimeridian splitter ───────────────────────────────────────────────
// Make a ring continuous (never jump >180° between consecutive points),
// then clip into the ±180 longitude windows and shift each piece back.
const unwrapRing = (r) => {
  const out = [r[0].slice()];
  for (let i = 1; i < r.length; i++) {
    let lng = r[i][0]; const lat = r[i][1], prev = out[i - 1][0];
    while (lng - prev >  180) lng -= 360;
    while (lng - prev < -180) lng += 360;
    out.push([lng, lat]);
  }
  return out;
};
const windowBox = (k) => {
  const a = -180 + 360 * k, b = 180 + 360 * k;
  return [[[a, -90], [b, -90], [b, 90], [a, 90], [a, -90]]];
};
const splitGeom = (g) => {
  const mp = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const unwrapped = mp.map((poly) => poly.map(unwrapRing));
  const out = [];
  for (let k = -1; k <= 1; k++) {
    let clipped; try { clipped = pc.intersection(unwrapped, windowBox(k)); } catch { clipped = []; }
    for (const poly of clipped) out.push(poly.map((ring) => ring.map(([l, a]) => [l - 360 * k, a])));
  }
  return { type: "MultiPolygon", coordinates: out };
};
const polysOf  = (g) => g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
const bboxOf   = (r) => { let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for (const [x,y] of r){ if(x<x0)x0=x; if(y<y0)y0=y; if(x>x1)x1=x; if(y>y1)y1=y; } return [x0,y0,x1,y1]; };
const ringPoint = (r) => { let x=0,y=0,n=r.length-1; for(let i=0;i<n;i++){x+=r[i][0];y+=r[i][1];} return [x/n,y/n]; };
const pip = (pt, r) => { let inside=false; const [px,py]=pt;
  for (let i=0,j=r.length-1;i<r.length;j=i++){ const [xi,yi]=r[i],[xj,yj]=r[j];
    if (((yi>py)!==(yj>py)) && (px < (xj-xi)*(py-yi)/(yj-yi)+xi)) inside=!inside; }
  return inside; };

function dropOrphanHoles(features) {
  const exts = [];
  for (const f of features) for (const poly of polysOf(f.geometry))
    exts.push({ name: f.properties.name, ring: poly[0], bb: bboxOf(poly[0]) });
  const filledByOther = (pt, self) => exts.some((e) => {
    if (e.name === self) return false;
    const [x0,y0,x1,y1] = e.bb;
    if (pt[0]<x0 || pt[0]>x1 || pt[1]<y0 || pt[1]>y1) return false;
    return pip(pt, e.ring);
  });
  for (const f of features) for (const poly of polysOf(f.geometry)) {
    if (poly.length <= 1) continue;                       // no holes
    const keep = poly.slice(1).filter((h) => filledByOther(ringPoint(h), f.properties.name));
    poly.length = 1;                                      // keep exterior
    poly.push(...keep);                                   // re-add real enclave holes
  }
}
const crossesSeam = (g) => {
  const mp = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  for (const poly of mp) for (const ring of poly)
    for (let i = 1; i < ring.length; i++)
      if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) return true;
  return false;
};

// ── build ────────────────────────────────────────────────────────────────
const topo  = JSON.parse(readFileSync(input, "utf8"));
let geojson = rewind(feature(topo, topo.objects.countries), false); // RFC7946 winding

const PATCH = { Kosovo: 383, Somaliland: 901 }; // give id-less disputed entities an id
const DROP  = new Set(["Antarctica"]);          // pole-wrap polygon; not a quiz country

geojson.features = geojson.features.filter((f) => {
  if (DROP.has(f.properties?.name)) return false;
  if (f.id != null) return true;
  if (PATCH[f.properties?.name] != null) { f.id = PATCH[f.properties.name]; return true; }
  return false;                              // ← drops Baikonur, Somaliland, reefs, bases…
});

dropOrphanHoles(geojson.features);

for (const f of geojson.features) {
  if (crossesSeam(f.geometry)) f.geometry = splitGeom(f.geometry);
  if (f.id != null && !Number.isNaN(Number(f.id))) f.id = Number(f.id); // numeric ids for MapLibre
}

writeFileSync(output, JSON.stringify(geojson));
const kb = (statSync(output).size / 1024).toFixed(0);
console.log(`✓ ${output} (${kb} KB, ${geojson.features.length} features)`);