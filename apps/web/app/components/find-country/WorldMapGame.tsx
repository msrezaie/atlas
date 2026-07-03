"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { geoCentroid } from "d3-geo";
import type { MapState, Region } from "@atlas/types";
import { GEO_URL, NUM_TO_ISO2, REGION_VIEW, LOCATOR_DOTS } from "@atlas/data";

// Defer the fetch to first use; module-level fetch would run during SSR,
// where Node rejects the relative URL.
let geoPromise: Promise<GeoJSON.FeatureCollection> | null = null;
const loadGeo = () =>
  (geoPromise ??= fetch(GEO_URL)
    .then((r) => r.json() as Promise<GeoJSON.FeatureCollection>)
    .catch((err) => {
      console.error("Failed to load geojson", err);
      geoPromise = null;
      throw err;
    }));

const ISO2_TO_NUM: Record<string, number> = Object.fromEntries(
  Object.entries(NUM_TO_ISO2).map(([num, iso2]) => [iso2, parseInt(num)]),
);

// ── Map style ─────────────────────────────────────────────────────────────────
// No tile source — just a flat ocean background with our GeoJSON countries on top.
const WATER = "#70D6EB";

const LAND_LOCKED = "#6fb3a9"; // not selectable — recedes
const LAND_SELECTABLE = "#c8dbd4"; // selectable — lighter, invites a click
const LAND_HOVER = "#dce8e2"; // selectable + hovered — muted teal, not bright
const LAND_CORRECT = "#22c55e";
const LAND_INCORRECT = "#ef4444";

const BORDER_LOCKED = "#182430";
const BORDER_SELECTABLE = "#7fa8bd";
const BORDER_HOVER = "#8fd4c6";
const BORDER_CORRECT = "#16a34a";
const BORDER_INCORRECT = "#dc2626";

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": WATER },
    },
  ],
};

// A small tileable "wavy water" texture — the water base tone plus faint
// sine-wave rows, drawn once and registered as a MapLibre background-pattern
// (patterns replace background-color, so the base tone is baked into the
// tile itself). Tile size (48) is evenly divisible by both the row spacing
// (16, → 3 rows) and the wavelength (24, → 2 full cycles per row), so it
// tiles seamlessly in both directions.
function buildWavePattern(dpr: number): ImageData {
  const size = 28;
  const px = Math.round(size * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = WATER;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1.5;
  const rows = 3;
  const rowGap = size / rows;
  const wavelength = size / 2;
  const amplitude = 3.5;

  for (let r = 0; r < rows; r++) {
    const y = rowGap * r + rowGap / 2;
    ctx.beginPath();
    for (let x = 0; x <= size; x++) {
      const yy = y + Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  return ctx.getImageData(0, 0, px, px);
}

// ── Paint expressions (read from feature-state set via setFeatureState) ───────

const FILL_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["==", ["feature-state", "status"], "correct"],
  LAND_CORRECT,
  ["==", ["feature-state", "status"], "incorrect"],
  LAND_INCORRECT,
  [
    "all",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "inPool"], false],
  ],
  LAND_HOVER,
  ["boolean", ["feature-state", "inPool"], false],
  LAND_SELECTABLE,
  LAND_LOCKED,
];

const BORDER_COLOR_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["==", ["feature-state", "status"], "correct"],
  BORDER_CORRECT,
  ["==", ["feature-state", "status"], "incorrect"],
  BORDER_INCORRECT,
  [
    "all",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "inPool"], false],
  ],
  BORDER_HOVER,
  ["boolean", ["feature-state", "inPool"], false],
  BORDER_SELECTABLE,
  BORDER_LOCKED,
];

const BORDER_WIDTH_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  [
    "any",
    ["==", ["feature-state", "status"], "correct"],
    ["==", ["feature-state", "status"], "incorrect"],
  ],
  1.5,
  ["boolean", ["feature-state", "inPool"], false],
  0.8,
  0.4,
];

// ── Component ─────────────────────────────────────────────────────────────────

interface WorldMapGameProps {
  countryStates: Record<string, MapState>;
  onCountryClick: (iso2: string) => void;
  region: Region;
  quizPool: Set<string>;
  answered: boolean;
}

export function WorldMapGame({
  countryStates,
  onCountryClick,
  region,
  quizPool,
  answered,
}: WorldMapGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredId = useRef<number | null>(null);
  const hoveredDot = useRef<number | null>(null);

  // Refs so event handlers always see current values without re-registering
  const answeredRef = useRef(answered);
  const quizPoolRef = useRef(quizPool);
  const onCountryClickRef = useRef(onCountryClick);
  const countryStatesRef = useRef(countryStates);

  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);
  useEffect(() => {
    quizPoolRef.current = quizPool;
  }, [quizPool]);
  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
  }, [onCountryClick]);
  useEffect(() => {
    countryStatesRef.current = countryStates;
  }, [countryStates]);

  // ── Initialise map once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const view = REGION_VIEW[region];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: view.center as [number, number],
      zoom: view.zoom,
      minZoom: view.minZoom,
      maxZoom: 16,
      attributionControl: false,
    });
    mapRef.current = map;

    const activeDotUnder = (point: maplibregl.Point) => {
      if (!map.getLayer("country-dots")) return false;
      return map
        .queryRenderedFeatures(point, { layers: ["country-dots"] })
        .some((f) => {
          const iso2 = NUM_TO_ISO2[Number(f.id)];
          return iso2 != null && quizPoolRef.current.has(iso2); // only dots that are real targets
        });
    };

    // In the quiz pool AND not already resolved. A country that's been
    // wrongly guessed ("incorrect") stays clickable — it can still be a
    // later question's real target. A country that's already been the
    // correct answer ("correct") is done; clicking it again would overwrite
    // its green mark with red the next time it's (wrongly) picked.
    const isClickable = (iso2: string) =>
      quizPoolRef.current.has(iso2) &&
      countryStatesRef.current[iso2] !== "correct";

    map.on("load", async () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!map.hasImage("water-waves")) {
        map.addImage("water-waves", buildWavePattern(dpr), { pixelRatio: dpr });
      }
      map.setPaintProperty("background", "background-pattern", "water-waves");

      const geojson = await loadGeo();

      map.addSource("countries", { type: "geojson", data: geojson });

      map.addLayer({
        id: "country-fills",
        type: "fill",
        source: "countries",
        paint: { "fill-color": FILL_EXPR, "fill-opacity": 1 },
      });
      map.addLayer({
        id: "country-borders",
        type: "line",
        source: "countries",
        paint: {
          "line-color": BORDER_COLOR_EXPR,
          "line-width": BORDER_WIDTH_EXPR,
        },
      });
      const dotFeatures = geojson.features
        .filter((f) => {
          const iso2 = NUM_TO_ISO2[Number(f.id)];
          return iso2 && LOCATOR_DOTS.has(iso2);
        })
        .map((f) => ({
          type: "Feature" as const,
          id: Number(f.id), // same numeric id as the polygon
          properties: { iso2: NUM_TO_ISO2[Number(f.id)] },
          geometry: {
            type: "Point" as const,
            coordinates: geoCentroid(f as GeoJSON.Feature),
          },
        }));

      map.addSource("country-dots", {
        type: "geojson",
        data: { type: "FeatureCollection", features: dotFeatures },
      });

      map.addLayer({
        id: "country-dots",
        type: "circle",
        source: "country-dots",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            1,
            ["case", ["boolean", ["feature-state", "hover"], false], 6, 4],
            6,
            ["case", ["boolean", ["feature-state", "hover"], false], 8.5, 6.5],
          ],
          "circle-color": [
            "case",
            ["==", ["feature-state", "status"], "correct"],
            LAND_CORRECT,
            ["==", ["feature-state", "status"], "incorrect"],
            LAND_INCORRECT,
            BORDER_HOVER,
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": BORDER_SELECTABLE,
          // only show dots for countries in the current quiz pool
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "inPool"], false],
            0.95,
            0,
          ],
          "circle-stroke-opacity": [
            "case",
            ["boolean", ["feature-state", "inPool"], false],
            1,
            0,
          ],
        },
      });

      // Apply any game state that arrived before the source was ready
      applyFeatureStates(map, quizPoolRef.current, countryStatesRef.current);
    });

    // Hover
    map.on("mousemove", "country-fills", (e) => {
      if (activeDotUnder(e.point)) {
        if (hoveredId.current !== null) {
          map.setFeatureState(
            { source: "countries", id: hoveredId.current },
            { hover: false },
          );
          hoveredId.current = null;
        }
        return;
      }
      const id = e.features?.[0]?.id as number | undefined;
      if (id == null) return;
      if (hoveredId.current !== null && hoveredId.current !== id) {
        map.setFeatureState(
          { source: "countries", id: hoveredId.current },
          { hover: false },
        );
      }
      hoveredId.current = id;
      map.setFeatureState({ source: "countries", id }, { hover: true });
      const iso2 = NUM_TO_ISO2[id] ?? "";
      map.getCanvas().style.cursor =
        !answeredRef.current && isClickable(iso2) ? "pointer" : "default";
    });

    map.on("mouseleave", "country-fills", () => {
      if (hoveredId.current !== null) {
        map.setFeatureState(
          { source: "countries", id: hoveredId.current },
          { hover: false },
        );
        hoveredId.current = null;
      }
      map.getCanvas().style.cursor = "default";
    });

    // Click — uses ref so it always calls the current question's handler
    map.on("click", "country-fills", (e) => {
      if (activeDotUnder(e.point)) return;

      const numId = e.features?.[0]?.id as number | undefined;
      if (numId == null) return;
      const iso2 = NUM_TO_ISO2[numId];
      if (iso2 && !answeredRef.current && isClickable(iso2)) {
        onCountryClickRef.current(iso2);
      }
    });
    map.on("mousemove", "country-dots", (e) => {
      const id = e.features?.[0]?.id as number | undefined;
      if (id == null) return;
      if (hoveredDot.current !== null && hoveredDot.current !== id)
        map.setFeatureState(
          { source: "country-dots", id: hoveredDot.current },
          { hover: false },
        );
      hoveredDot.current = id;
      map.setFeatureState({ source: "country-dots", id }, { hover: true });
      const iso2 = NUM_TO_ISO2[id] ?? "";
      map.getCanvas().style.cursor =
        !answeredRef.current && isClickable(iso2) ? "pointer" : "default";
    });

    map.on("mouseleave", "country-dots", () => {
      if (hoveredDot.current !== null) {
        map.setFeatureState(
          { source: "country-dots", id: hoveredDot.current },
          { hover: false },
        );
        hoveredDot.current = null;
      }
      map.getCanvas().style.cursor = "default";
    });

    map.on("click", "country-dots", (e) => {
      const id = e.features?.[0]?.id as number | undefined;
      if (id == null) return;
      const iso2 = NUM_TO_ISO2[id];
      if (iso2 && !answeredRef.current && isClickable(iso2))
        onCountryClickRef.current(iso2);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync game state → feature state ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // If source isn't loaded yet, the load handler above will apply on ready
    if (!map.getSource("countries")) return;
    applyFeatureStates(map, quizPool, countryStates);
  }, [countryStates, quizPool]);

  // ── Region change → fly ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const view = REGION_VIEW[region];
    map.flyTo({
      center: view.center as [number, number],
      zoom: view.zoom,
      duration: 600,
    });
    map.setMinZoom(view.minZoom);
  }, [region]);

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetView = () => {
    const view = REGION_VIEW[region];
    mapRef.current?.flyTo({
      center: view.center as [number, number],
      zoom: view.zoom,
      duration: 400,
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
        {(
          [
            { icon: <Plus className="w-3.5 h-3.5" />, action: zoomIn },
            { icon: <Minus className="w-3.5 h-3.5" />, action: zoomOut },
            { icon: <RotateCcw className="w-3 h-3" />, action: resetView },
          ] as const
        ).map(({ icon, action }, i) => (
          <button
            key={i}
            onClick={action}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-md"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border-strong)",
              color: "var(--fg-muted)",
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      <p
        className="absolute bottom-4 left-4 text-[10px] font-medium select-none z-10 px-2 py-1 rounded-md"
        style={{
          color: "var(--fg-muted)",
          background: "var(--surface-elevated)",
          border: "1px solid var(--border-strong)",
        }}
      >
        Scroll to zoom · drag to pan
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyFeatureStates(
  map: maplibregl.Map,
  quizPool: Set<string>,
  countryStates: Record<string, MapState>,
) {
  for (const [iso2, numId] of Object.entries(ISO2_TO_NUM)) {
    const state = {
      status: countryStates[iso2] ?? "neutral",
      inPool: quizPool.has(iso2),
    };
    map.setFeatureState({ source: "countries", id: numId }, state);
    if (LOCATOR_DOTS.has(iso2) && map.getSource("country-dots"))
      map.setFeatureState({ source: "country-dots", id: numId }, state);
  }
}
