// ── lightweight globe file (low detail, decorative background only) ────────
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { feature } = require("topojson-client");
const rewind      = require("@mapbox/geojson-rewind");
const pc          = require("polygon-clipping");

const root   = join(dirname(fileURLToPath(import.meta.url)), "..");

const globeTopo = JSON.parse(readFileSync(join(root, "public/countries-110m.json"), "utf8"));
const globeGeo  = feature(globeTopo, globeTopo.objects.countries);
const globeOut  = join(root, "public/countries-110m.geojson");
writeFileSync(globeOut, JSON.stringify(globeGeo));
console.log(`✓ ${globeOut} (${(statSync(globeOut).size / 1024).toFixed(0)} KB, globe)`);