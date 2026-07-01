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
const loadGeo = () => (
  geoPromise ??= fetch(GEO_URL)
    .then((r) => r.json() as Promise<GeoJSON.FeatureCollection>)
    .catch((err) => {
      console.error("Failed to load geojson", err);
      geoPromise = null;
      throw err;
    })
);

const ISO2_TO_NUM: Record<string, number> = Object.fromEntries(
  Object.entries(NUM_TO_ISO2).map(([num, iso2]) => [iso2, parseInt(num)])
);

// ── Map style ─────────────────────────────────────────────────────────────────
// No tile source — just a flat ocean background with our GeoJSON countries on top.

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#b6cdd6" } }],
};

// ── Paint expressions (read from feature-state set via setFeatureState) ───────

const FILL_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["==", ["feature-state", "status"], "correct"],   "#22c55e",
  ["==", ["feature-state", "status"], "incorrect"], "#ef4444",
  ["==", ["feature-state", "status"], "found"],   "#15803d",
  ["==", ["feature-state", "status"], "missed"], "#b45309",
  ["all",
    ["boolean", ["feature-state", "hover"],  false],
    ["boolean", ["feature-state", "inPool"], false],
  ], "#dce8e2",
  ["boolean", ["feature-state", "inPool"], false], "#c8dbd4",
  "#a8c4b8",
];

const BORDER_COLOR_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["==", ["feature-state", "status"], "correct"],   "#16a34a",
  ["==", ["feature-state", "status"], "incorrect"], "#dc2626",
  "#8faaa4",
];

const BORDER_WIDTH_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["any",
    ["==", ["feature-state", "status"], "correct"],
    ["==", ["feature-state", "status"], "incorrect"],
  ], 1.5,
  ["boolean", ["feature-state", "inPool"], false], 0.8,
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
  countryStates, onCountryClick, region, quizPool, answered,
}: WorldMapGameProps) {
  const containerRef       = useRef<HTMLDivElement>(null);
  const mapRef             = useRef<maplibregl.Map | null>(null);
  const hoveredId          = useRef<number | null>(null);
  const hoveredDot         = useRef<number | null>(null);

  // Refs so event handlers always see current values without re-registering
  const answeredRef        = useRef(answered);
  const quizPoolRef        = useRef(quizPool);
  const onCountryClickRef  = useRef(onCountryClick);
  const countryStatesRef   = useRef(countryStates);

  useEffect(() => { answeredRef.current       = answered;       }, [answered]);
  useEffect(() => { quizPoolRef.current       = quizPool;       }, [quizPool]);
  useEffect(() => { onCountryClickRef.current = onCountryClick; }, [onCountryClick]);
  useEffect(() => { countryStatesRef.current  = countryStates;  }, [countryStates]);

  // ── Initialise map once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const view = REGION_VIEW[region];

    const map = new maplibregl.Map({
      container:          containerRef.current,
      style:              MAP_STYLE,
      center:             view.center as [number, number],
      zoom:               view.zoom,
      minZoom:            view.minZoom,
      maxZoom:            16,
      attributionControl: false,
    });
    mapRef.current = map;

    const activeDotUnder = (point: maplibregl.Point) => {
      if (!map.getLayer("country-dots")) return false;
      return map.queryRenderedFeatures(point, { layers: ["country-dots"] }).some((f) => {
        const iso2 = NUM_TO_ISO2[Number(f.id)];
        return iso2 != null && quizPoolRef.current.has(iso2);   // only dots that are real targets
      });
    };

    map.on("load", async () => {
      const geojson = await loadGeo();

      map.addSource("countries", { type: "geojson", data: geojson });

      map.addLayer({
        id: "country-fills", type: "fill", source: "countries",
        paint: { "fill-color": FILL_EXPR, "fill-opacity": 1 },
      });
      map.addLayer({
        id: "country-borders", type: "line", source: "countries",
        paint: { "line-color": BORDER_COLOR_EXPR, "line-width": BORDER_WIDTH_EXPR },
      });
      const dotFeatures = geojson.features
        .filter((f) => {
          const iso2 = NUM_TO_ISO2[Number(f.id)];
          return iso2 && LOCATOR_DOTS.has(iso2);
        })
        .map((f) => ({
          type: "Feature" as const,
          id: Number(f.id),                       // same numeric id as the polygon
          properties: { iso2: NUM_TO_ISO2[Number(f.id)] },
          geometry: { type: "Point" as const, coordinates: geoCentroid(f as GeoJSON.Feature) },
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
            "interpolate", ["linear"], ["zoom"],
            1, ["case", ["boolean", ["feature-state", "hover"], false], 6,   4],
            6, ["case", ["boolean", ["feature-state", "hover"], false], 8.5, 6.5],
          ],
          "circle-color": [
            "case",
            ["==", ["feature-state", "status"], "correct"],   "#22c55e",
            ["==", ["feature-state", "status"], "incorrect"], "#ef4444",
            "#c8dbd4",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
          // only show dots for countries in the current quiz pool
          "circle-opacity":        ["case", ["boolean", ["feature-state", "inPool"], false], 0.95, 0],
          "circle-stroke-opacity": ["case", ["boolean", ["feature-state", "inPool"], false], 1, 0],
        },
      });

      // Apply any game state that arrived before the source was ready
      applyFeatureStates(map, quizPoolRef.current, countryStatesRef.current);
    });

    // Hover
    map.on("mousemove", "country-fills", (e) => {
      if (activeDotUnder(e.point)) {
        if (hoveredId.current !== null) {
          map.setFeatureState({ source: "countries", id: hoveredId.current }, { hover: false });
          hoveredId.current = null;
        }
        return;
      }
      const id = e.features?.[0]?.id as number | undefined;
      if (id == null) return;
      if (hoveredId.current !== null && hoveredId.current !== id) {
        map.setFeatureState({ source: "countries", id: hoveredId.current }, { hover: false });
      }
      hoveredId.current = id;
      map.setFeatureState({ source: "countries", id }, { hover: true });
      const iso2 = NUM_TO_ISO2[id] ?? "";
      map.getCanvas().style.cursor =
        !answeredRef.current && quizPoolRef.current.has(iso2) ? "pointer" : "default";
    });

    map.on("mouseleave", "country-fills", () => {
      if (hoveredId.current !== null) {
        map.setFeatureState({ source: "countries", id: hoveredId.current }, { hover: false });
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
      if (iso2 && !answeredRef.current && quizPoolRef.current.has(iso2)) {
        onCountryClickRef.current(iso2);
      }
    });
    map.on("mousemove", "country-dots", (e) => {
      const id = e.features?.[0]?.id as number | undefined;
      if (id == null) return;
      if (hoveredDot.current !== null && hoveredDot.current !== id)
        map.setFeatureState({ source: "country-dots", id: hoveredDot.current }, { hover: false });
      hoveredDot.current = id;
      map.setFeatureState({ source: "country-dots", id }, { hover: true });
      const iso2 = NUM_TO_ISO2[id] ?? "";
      map.getCanvas().style.cursor =
        !answeredRef.current && quizPoolRef.current.has(iso2) ? "pointer" : "default";
    });

    map.on("mouseleave", "country-dots", () => {
      if (hoveredDot.current !== null) {
        map.setFeatureState({ source: "country-dots", id: hoveredDot.current }, { hover: false });
        hoveredDot.current = null;
      }
      map.getCanvas().style.cursor = "default";
    });

    map.on("click", "country-dots", (e) => {
      const id = e.features?.[0]?.id as number | undefined;
      if (id == null) return;
      const iso2 = NUM_TO_ISO2[id];
      if (iso2 && !answeredRef.current && quizPoolRef.current.has(iso2))
        onCountryClickRef.current(iso2);
    });

    return () => { map.remove(); mapRef.current = null; };
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
    map.flyTo({ center: view.center as [number, number], zoom: view.zoom, duration: 600 });
    map.setMinZoom(view.minZoom);
  }, [region]);

  const zoomIn    = () => mapRef.current?.zoomIn();
  const zoomOut   = () => mapRef.current?.zoomOut();
  const resetView = () => {
    const view = REGION_VIEW[region];
    mapRef.current?.flyTo({ center: view.center as [number, number], zoom: view.zoom, duration: 400 });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
        {([
          { icon: <Plus      className="w-3.5 h-3.5" />, action: zoomIn   },
          { icon: <Minus     className="w-3.5 h-3.5" />, action: zoomOut  },
          { icon: <RotateCcw className="w-3 h-3"    />, action: resetView },
        ] as const).map(({ icon, action }, i) => (
          <button key={i} onClick={action}
            className="w-8 h-8 rounded-lg bg-white/80 border border-black/10 text-slate-600 flex items-center justify-center hover:bg-white transition-colors shadow-md">
            {icon}
          </button>
        ))}
      </div>

      <p className="absolute bottom-4 left-4 text-[10px] text-slate-500/70 font-medium select-none z-10">
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
    const state = { status: countryStates[iso2] ?? "neutral", inPool: quizPool.has(iso2) };
    map.setFeatureState({ source: "countries", id: numId }, state);
    if (LOCATOR_DOTS.has(iso2) && map.getSource("country-dots"))
      map.setFeatureState({ source: "country-dots", id: numId }, state);
  }
}
