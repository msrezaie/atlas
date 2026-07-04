"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Region } from "@atlas/types";
import { NUM_TO_ISO2, REGION_VIEW, COUNTRIES } from "@atlas/data";
import {
  ISO2_TO_NUM,
  createCountryMap,
  buildDotFeatures,
  featureBoxes,
  mergeBoxes,
  boxBounds,
  type LngLatBox,
} from "../../lib/countryMap";
import { GlobeSpinner } from "../shared/GlobeSpinner";
import { MapZoomControls } from "../shared/MapZoomControls";

const BY_ISO = Object.fromEntries(COUNTRIES.map((c) => [c.iso2, c]));

// The 10m GeoJSON carries separate polygons for territories that aren't real
// countries in our dataset (Somaliland, Hong Kong, Western Sahara…). Only the
// polygons that map to a country we actually have facts for are interactive —
// everything else stays inert (no hover highlight, no pointer, no select).
const iso2Of = (numId: number | undefined): string | null => {
  if (numId == null) return null;
  const iso2 = NUM_TO_ISO2[numId];
  return iso2 && BY_ISO[iso2] ? iso2 : null;
};

// Every country is explorable here (no locked/selectable split like the
// game map) — just a neutral base tone, a hover state, and a selected
// accent that matches the app's teal.
const LAND = "#c8dbd4";
const LAND_HOVER = "#dce8e2";
const LAND_SELECTED = "#2ee6c5";

const BORDER = "#7fa8bd";
const BORDER_HOVER = "#8fd4c6";
const BORDER_SELECTED = "#00c8a8";

const FILL_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  LAND_SELECTED,
  ["boolean", ["feature-state", "hover"], false],
  LAND_HOVER,
  LAND,
];

const BORDER_COLOR_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  BORDER_SELECTED,
  ["boolean", ["feature-state", "hover"], false],
  BORDER_HOVER,
  BORDER,
];

const BORDER_WIDTH_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  2,
  ["boolean", ["feature-state", "hover"], false],
  1,
  0.5,
];

// Locator dots for small countries — every dot is explorable here (there's no
// quiz pool), so they're always shown; only the selected/hover accent varies.
const DOT_COLOR_EXPR: maplibregl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  LAND_SELECTED,
  BORDER_HOVER,
];

// Set (or clear) a country's `selected` feature-state on both the polygon and
// its locator dot, so a small country selected from the list highlights its dot
// too. Setting state on a dot id that isn't in the dots source is a harmless
// no-op, so no per-country guard is needed.
function setSelected(map: maplibregl.Map, numId: number, on: boolean) {
  map.setFeatureState({ source: "countries", id: numId }, { selected: on });
  if (map.getSource("country-dots"))
    map.setFeatureState(
      { source: "country-dots", id: numId },
      { selected: on },
    );
}

export interface LearningMapProps {
  region: Region;
  selectedIso2: string | null;
  onSelect: (iso2: string) => void;
  onClear: () => void;
}

/** Explorer map for Learning Mode — click any country to select + zoom it. */
export function LearningMap({
  region,
  selectedIso2,
  onSelect,
  onClear,
}: LearningMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredId = useRef<number | null>(null);
  const hoveredDot = useRef<number | null>(null);
  const selectedId = useRef<number | null>(null);
  const boxesRef = useRef<Map<number, LngLatBox>>(new Map());
  const onSelectRef = useRef(onSelect);
  const onClearRef = useRef(onClear);
  const selectedIso2Ref = useRef(selectedIso2);
  const regionRef = useRef(region);
  const [ready, setReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setShowLoader(false), 300);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);
  useEffect(() => {
    selectedIso2Ref.current = selectedIso2;
  }, [selectedIso2]);
  useEffect(() => {
    regionRef.current = region;
  }, [region]);

  // Fit the camera to a country's full outline — proportional zoom, so a large
  // country (Russia) stays wide and a small one (Togo) zooms right in, with the
  // whole outline in view. Capped so micro-states don't zoom to street level.
  const fitCountry = useCallback((numId: number) => {
    const map = mapRef.current;
    const box = boxesRef.current.get(numId);
    if (!map || !box) return;
    // maxZoom keeps small countries from zooming in uncomfortably far — their
    // outline is fully framed with margin rather than filling the whole panel.
    map.fitBounds(boxBounds(box), { padding: 40, maxZoom: 5, duration: 700 });
  }, []);

  // Fit the camera to a whole region's extent (the full continent outline).
  // World has no meaningful bbox to fit, so it just returns to the overview.
  const fitRegion = useCallback((r: Region) => {
    const map = mapRef.current;
    if (!map) return;
    if (r === "World") {
      const v = REGION_VIEW.World;
      map.flyTo({
        center: v.center as [number, number],
        zoom: v.zoom,
        duration: 600,
      });
      return;
    }
    const boxes: LngLatBox[] = [];
    for (const c of COUNTRIES) {
      if (c.continent !== r) continue;
      const numId = ISO2_TO_NUM[c.iso2];
      const box = numId != null ? boxesRef.current.get(numId) : undefined;
      if (box) boxes.push(box);
    }
    const merged = mergeBoxes(boxes);
    if (merged)
      map.fitBounds(boxBounds(merged), {
        padding: 30,
        maxZoom: 5,
        duration: 600,
      });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = createCountryMap(containerRef.current, REGION_VIEW[region], {
      onReady: () => setReady(true),
      addLayers: (map, geojson) => {
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
              [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                8.5,
                6.5,
              ],
            ],
            "circle-color": DOT_COLOR_EXPR,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": BORDER_SELECTED,
            "circle-opacity": 0.95,
            "circle-stroke-opacity": 1,
          },
        });

        boxesRef.current = featureBoxes(geojson);

        // Restore an already-selected country (e.g. remounting with a selection).
        const iso2 = selectedIso2Ref.current;
        if (iso2) {
          const numId = ISO2_TO_NUM[iso2];
          if (numId != null) {
            setSelected(map, numId, true);
            selectedId.current = numId;
          }
        }
      },
    });
    mapRef.current = map;

    const activeDotUnder = (point: maplibregl.Point) =>
      map.getLayer("country-dots")
        ? map.queryRenderedFeatures(point, { layers: ["country-dots"] })
            .length > 0
        : false;

    map.on("mousemove", "country-fills", (e) => {
      // A dot sits on top of tiny polygons — let its own handler own the hover.
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
      // Clear any previous hover first, so moving off a country onto a
      // non-selectable territory doesn't leave the old one highlighted.
      if (hoveredId.current !== null && hoveredId.current !== id) {
        map.setFeatureState(
          { source: "countries", id: hoveredId.current },
          { hover: false },
        );
        hoveredId.current = null;
      }
      if (id == null || iso2Of(id) == null) {
        map.getCanvas().style.cursor = "default";
        return;
      }
      hoveredId.current = id;
      map.setFeatureState({ source: "countries", id }, { hover: true });
      map.getCanvas().style.cursor = "pointer";
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

    map.on("click", "country-fills", (e) => {
      if (activeDotUnder(e.point)) return;
      const iso2 = iso2Of(e.features?.[0]?.id as number | undefined);
      if (iso2) onSelectRef.current(iso2);
    });

    // Locator dots — same select behaviour, easier target for small countries.
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
      map.getCanvas().style.cursor = "pointer";
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
      const iso2 = iso2Of(e.features?.[0]?.id as number | undefined);
      if (iso2) onSelectRef.current(iso2);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selection change → highlight + fit the country's outline. Clearing the
  // selection (back to browsing) refits the current region's extent.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("countries")) return;

    if (selectedId.current !== null) {
      setSelected(map, selectedId.current, false);
      selectedId.current = null;
    }

    if (selectedIso2) {
      const numId = ISO2_TO_NUM[selectedIso2];
      if (numId != null) {
        setSelected(map, numId, true);
        selectedId.current = numId;
        fitCountry(numId);
      }
    } else {
      fitRegion(regionRef.current);
    }
  }, [selectedIso2, fitCountry, fitRegion]);

  // Region change while nothing is selected → fit that region's extent.
  useEffect(() => {
    if (selectedIso2Ref.current) return;
    fitRegion(region);
  }, [region, fitRegion]);

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetView = () => {
    if (selectedIso2Ref.current) {
      onClearRef.current();
      return;
    }
    const view = REGION_VIEW[regionRef.current];
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
          <GlobeSpinner size={56} label="Loading map…" />
        </div>
      )}

      <MapZoomControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10"
      />
    </div>
  );
}
