"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { feature } from "topojson-client";
import { Plus, Minus, RotateCcw } from "lucide-react";

import type { MapState, Region } from "@atlas/types";
import { COUNTRIES, GEO_URL, NUM_TO_ISO2, REGION_VIEW, CONTINENT_COLOR } from "@atlas/data";

// Reverse lookup: iso2 → numeric feature ID used by the topojson / MapLibre source
const ISO2_TO_NUM: Record<string, number> = Object.fromEntries(
  Object.entries(NUM_TO_ISO2).map(([num, iso2]) => [iso2, parseInt(num)])
);

const BLANK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#030810" } }],
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
};

// Paint expression that reads game state from MapLibre feature-state
const FILL_COLOR_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["==", ["feature-state", "status"], "correct"],   "#16a34a",
  ["==", ["feature-state", "status"], "incorrect"], "#b91c1c",
  ["all",
    ["boolean", ["feature-state", "hover"],  false],
    ["boolean", ["feature-state", "inPool"], false],
  ], ["coalesce", ["feature-state", "continentHover"], "#040b16"],
  ["boolean", ["feature-state", "inPool"], false],
    ["coalesce", ["feature-state", "continentBase"], "#040b16"],
  "#040b16",
];

const BORDER_COLOR_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["==", ["feature-state", "status"], "correct"],   "#4ade80",
  ["==", ["feature-state", "status"], "incorrect"], "#f87171",
  ["boolean", ["feature-state", "inPool"], false],
    ["coalesce", ["feature-state", "continentBorder"], "#030a12"],
  "#030a12",
];

const BORDER_WIDTH_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["any",
    ["==", ["feature-state", "status"], "correct"],
    ["==", ["feature-state", "status"], "incorrect"],
  ], 1.2,
  ["boolean", ["feature-state", "inPool"], false], 0.6,
  0.15,
];

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
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<maplibregl.Map | null>(null);
  const hoveredId     = useRef<number | null>(null);
  const answeredRef   = useRef(answered);
  const quizPoolRef   = useRef(quizPool);

  // Keep refs in sync so event handlers always see current values without re-registering
  useEffect(() => { answeredRef.current  = answered;  }, [answered]);
  useEffect(() => { quizPoolRef.current  = quizPool;  }, [quizPool]);

  // ── Initialise map once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const view = REGION_VIEW[region];

    const map = new maplibregl.Map({
      container:        containerRef.current,
      style:            BLANK_STYLE,
      center:           view.center as [number, number],
      zoom:             view.zoom,
      minZoom:          view.minZoom,
      maxZoom:          16,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", async () => {
      // Fetch topojson and convert to GeoJSON in one shot
      const topo    = await fetch(GEO_URL).then((r) => r.json());
      const topoObj = topo as unknown as { objects: { countries: Parameters<typeof feature>[1] } };
      const geojson = feature(topo, topoObj.objects.countries) as unknown as GeoJSON.FeatureCollection;

      map.addSource("countries", { type: "geojson", data: geojson, generateId: false });

      map.addLayer({
        id: "country-fills", type: "fill", source: "countries",
        paint: { "fill-color": FILL_COLOR_EXPR, "fill-opacity": 1 },
      });
      map.addLayer({
        id: "country-borders", type: "line", source: "countries",
        paint: { "line-color": BORDER_COLOR_EXPR, "line-width": BORDER_WIDTH_EXPR },
      });

      // Initialise feature state for every country
      initFeatureStates(map, quizPoolRef.current, {});
    });

    // Hover tracking
    map.on("mousemove", "country-fills", (e) => {
      const id = e.features?.[0]?.id as number | undefined;
      if (id == null) return;
      if (hoveredId.current !== null && hoveredId.current !== id) {
        map.setFeatureState({ source: "countries", id: hoveredId.current }, { hover: false });
      }
      hoveredId.current = id;
      map.setFeatureState({ source: "countries", id }, { hover: true });
      map.getCanvas().style.cursor =
        !answeredRef.current && quizPoolRef.current.has(NUM_TO_ISO2[id] ?? "") ? "pointer" : "default";
    });

    map.on("mouseleave", "country-fills", () => {
      if (hoveredId.current !== null) {
        map.setFeatureState({ source: "countries", id: hoveredId.current }, { hover: false });
        hoveredId.current = null;
      }
      map.getCanvas().style.cursor = "default";
    });

    // Click handler
    map.on("click", "country-fills", (e) => {
      const numId = e.features?.[0]?.id as number | undefined;
      if (numId == null) return;
      const iso2 = NUM_TO_ISO2[numId];
      if (iso2 && !answeredRef.current && quizPoolRef.current.has(iso2)) {
        onCountryClick(iso2);
      }
    });

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync game state → feature state ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    initFeatureStates(map, quizPool, countryStates);
  }, [countryStates, quizPool]);

  // ── Fly to new region ────────────────────────────────────────────────────────
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
          { icon: <Plus     className="w-3.5 h-3.5" />, action: zoomIn    },
          { icon: <Minus    className="w-3.5 h-3.5" />, action: zoomOut   },
          { icon: <RotateCcw className="w-3 h-3"   />, action: resetView  },
        ] as const).map(({ icon, action }, i) => (
          <button key={i} onClick={action}
            className="w-8 h-8 rounded-lg bg-[#061428]/90 border border-white/15 text-[#e8f4ff] flex items-center justify-center hover:bg-[#0a2040] transition-colors backdrop-blur-sm shadow-lg">
            {icon}
          </button>
        ))}
      </div>

      <p className="absolute bottom-4 left-4 text-[10px] text-[#6b9ab8]/55 font-medium select-none z-10">
        Scroll to zoom · drag to pan
      </p>
    </div>
  );
}

// Sets feature state for all countries based on current quiz pool and game states.
// Called on mount and whenever countryStates changes.
function initFeatureStates(
  map: maplibregl.Map,
  quizPool: Set<string>,
  countryStates: Record<string, MapState>,
) {
  for (const [iso2, numId] of Object.entries(ISO2_TO_NUM)) {
    const country  = COUNTRIES.find((c) => c.iso2 === iso2);
    const colors   = country ? CONTINENT_COLOR[country.continent] : null;
    const inPool   = quizPool.has(iso2);
    const status   = countryStates[iso2] ?? "neutral";

    map.setFeatureState({ source: "countries", id: numId }, {
      status,
      inPool,
      continentBase:   colors?.base   ?? "#040b16",
      continentHover:  colors?.hover  ?? "#040b16",
      continentBorder: colors?.border ?? "#030a12",
    });
  }
}