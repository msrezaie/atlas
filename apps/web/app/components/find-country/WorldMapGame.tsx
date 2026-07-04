"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapState, Region } from "@atlas/types";
import { NUM_TO_ISO2, REGION_VIEW, LOCATOR_DOTS } from "@atlas/data";
import {
  ISO2_TO_NUM,
  createCountryMap,
  buildDotFeatures,
} from "../../lib/countryMap";
import { GlobeSpinner } from "../shared/GlobeSpinner";
import { MapZoomControls } from "../shared/MapZoomControls";

// ── Palette (game-specific: selectable vs locked, plus correct/incorrect) ─────
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
  const [ready, setReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setShowLoader(false), 300);
    return () => clearTimeout(t);
  }, [ready]);

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

    const map = createCountryMap(containerRef.current, REGION_VIEW[region], {
      onReady: () => setReady(true),
      addLayers: (map) => {
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

        map.addSource("country-dots", {
          type: "geojson",
          data: buildDotFeatures(),
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
      },
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

      {showLoader && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--surface)",
            opacity: ready ? 0 : 1,
            pointerEvents: ready ? "none" : "auto",
            transition: "opacity 300ms ease-out",
          }}
        >
          <GlobeSpinner size={64} label="Loading map…" />
        </div>
      )}

      <MapZoomControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
      />

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
