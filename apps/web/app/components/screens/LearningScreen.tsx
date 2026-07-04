"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowLeft,
  Search,
  MapPin,
  Users,
  Languages,
  Coins,
  Ruler,
  Compass,
  Landmark,
  History,
  Sparkles,
  X,
} from "lucide-react";
import type { Country, Region } from "@atlas/types";
import {
  COUNTRIES,
  REGIONS,
  getCountryFacts,
  type CountryFacts,
} from "@atlas/data";
import { IconButton } from "../ui/actions/IconButton";
import { SegmentedControl } from "../ui/forms/SegmentedControl";
import { CountryDetail } from "../ui/display/CountryDetail";
import { Flag } from "../ui/display/Flag";
import { LearningMap } from "../learning/LearningMap";

export interface LearningScreenProps {
  onHome: () => void;
}

const REGION_ACCENTS: Record<string, string> = {
  Asia: "var(--c-asia)",
  Africa: "var(--c-africa)",
  Americas: "var(--c-americas)",
  Europe: "var(--c-europe)",
  Oceania: "var(--c-oceania)",
};

function fmtPop(n: number) {
  if (n >= 1e9)
    return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1).replace(/\.0$/, "") + "B";
  if (n >= 1e6)
    return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "K";
  return String(n);
}

function detailFields(c: Country, facts: CountryFacts) {
  return [
    { icon: <MapPin size={16} />, label: "Capital", value: c.capital },
    {
      icon: <Users size={16} />,
      label: "Population",
      value: fmtPop(c.population),
    },
    {
      icon: <Languages size={16} />,
      label: "Languages",
      value: facts.languages?.length
        ? facts.languages.join(", ")
        : facts.language,
    },
    { icon: <Coins size={16} />, label: "Currency", value: facts.currency },
    {
      icon: <Ruler size={16} />,
      label: "Area",
      value: c.area.toLocaleString() + " km²",
    },
    { icon: <Compass size={16} />, label: "Continent", value: c.continent },
  ];
}

const chipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 10px",
  borderRadius: "var(--radius-full)",
  background: "var(--overlay-2)",
  border: "1px solid var(--border-neutral)",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--fg)",
};

function section(icon: ReactNode, title: string, body: ReactNode) {
  return (
    <div>
      <div
        className="atlas-eyebrow"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ color: "var(--primary)", display: "flex" }}>{icon}</span>
        {title}
      </div>
      {body}
    </div>
  );
}

/** The richer prose sections shown beneath the fact grid. */
function richSections(facts: CountryFacts) {
  const blocks: ReactNode[] = [];

  if (facts.colonization && facts.colonization !== "—") {
    blocks.push(
      <div key="col">
        {section(
          <History size={13} />,
          "Colonial history",
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.55,
              color: "var(--fg-muted)",
            }}
          >
            {facts.colonization}
          </p>,
        )}
      </div>,
    );
  }

  const landmarks = facts.landmarks ?? [];
  if (landmarks.length) {
    blocks.push(
      <div key="lm">
        {section(
          <Landmark size={13} />,
          "Famous landmarks",
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {landmarks.map((l) => (
              <span key={l} style={chipStyle}>
                {l}
              </span>
            ))}
          </div>,
        )}
      </div>,
    );
  }

  const notable = facts.facts ?? [];
  if (notable.length) {
    blocks.push(
      <div key="ft">
        {section(
          <Sparkles size={13} />,
          "Did you know",
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {notable.map((f, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "var(--fg-muted)",
                }}
              >
                <span style={{ color: "var(--primary)", flexShrink: 0 }}>•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>,
        )}
      </div>,
    );
  }

  if (!blocks.length) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        marginTop: 18,
        paddingTop: 16,
        borderTop: "1px solid var(--border-neutral)",
      }}
    >
      {blocks}
    </div>
  );
}

const BY_ISO: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.iso2, c]),
);

/** Small caption above the list — the country count, in a natural spot. */
function listHeader(count: number) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "0 2px",
      }}
    >
      <span className="atlas-eyebrow">Countries</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--fg-subtle)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </span>
    </div>
  );
}

function searchBar(query: string, onChange: (v: string) => void) {
  return (
    <div style={{ position: "relative" }}>
      <span
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--fg-subtle)",
          display: "flex",
        }}
      >
        <Search size={16} />
      </span>
      <input
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search countries"
        style={{
          width: "100%",
          boxSizing: "border-box",
          height: 40,
          padding: "0 12px 0 36px",
          background: "var(--surface-input)",
          border: "1px solid var(--border-neutral-strong)",
          borderRadius: "var(--radius-md)",
          color: "var(--fg)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          outline: "none",
        }}
      />
    </div>
  );
}

function countryList(
  list: Country[],
  selectedIso2: string | null,
  onPick: (c: Country) => void,
  columns: number,
) {
  return (
    <div
      style={{
        display: "grid",
        // Fixed column count — minmax(0,1fr) lets tiles shrink so names ellipsis
        // rather than overflow. Desktop packs three across; mobile two.
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: 6,
      }}
    >
      {list.map((c) => {
        const on = c.iso2 === selectedIso2;
        return (
          <button
            key={c.iso2}
            type="button"
            onClick={() => onPick(c)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              textAlign: "left",
              cursor: "pointer",
              borderRadius: "var(--radius-lg)",
              border: `1px solid ${on ? "var(--border-strong)" : "var(--border-neutral)"}`,
              background: on
                ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                : "var(--overlay-1)",
              WebkitTapHighlightColor: "transparent",
              transition:
                "background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
            }}
          >
            {/* Flags bumped up a size (sm → md) for the roomier grid tiles. */}
            <Flag iso2={c.iso2} name={c.name} size="md" />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--fg)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.name}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.capital}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Split-panel country explorer: a map on one side (click a country to zoom
 * + highlight it), a filterable list on the other (pick a country there and
 * the map follows), and the selected country's facts anchored under the
 * map — no full-screen modal, everything stays visible at once.
 */
export function LearningScreen({ onHome }: LearningScreenProps) {
  const [region, setRegion] = useState<Region>("World");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);

  const list = COUNTRIES.filter(
    (c) => region === "World" || c.continent === region,
  )
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function pickIso2(iso2: string) {
    const c = BY_ISO[iso2];
    if (c) setSelected(c);
  }

  function changeRegion(r: Region) {
    setRegion(r);
    setSelected(null);
  }

  const selectedFacts = selected ? getCountryFacts(selected.iso2) : null;
  const detailPanel = selected ? (
    <div style={{ position: "relative" }}>
      <IconButton
        label="Clear selection"
        size="sm"
        onClick={() => setSelected(null)}
        style={{ position: "absolute", top: 0, right: 0 }}
      >
        <X size={14} />
      </IconButton>
      <CountryDetail
        country={selected}
        fields={detailFields(selected, selectedFacts!)}
        columns={2}
      />
      {richSections(selectedFacts!)}
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "18px 12px",
        textAlign: "center",
        color: "var(--fg-subtle)",
      }}
    >
      <Compass size={22} />
      <p style={{ margin: 0, fontSize: 13 }}>
        Pick a country on the map or from the list to see its details.
      </p>
    </div>
  );

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-neutral)",
      }}
    >
      <IconButton label="Back" onClick={onHome} size="sm">
        <ArrowLeft size={16} />
      </IconButton>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--fg)",
          margin: 0,
          flex: 1,
        }}
      >
        Explore Countries
      </h1>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {header}

      {/* Desktop: map + facts on the left, filterable list on the right */}
      <div
        className="hidden md:flex"
        style={{ flex: 1, minHeight: 0, gap: 16, padding: 16, boxSizing: "border-box" }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 420,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              borderRadius: "var(--radius-2xl)",
              overflow: "hidden",
              border: "1px solid var(--border-neutral-strong)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <LearningMap
              region={region}
              selectedIso2={selected?.iso2 ?? null}
              onSelect={pickIso2}
              onClear={() => setSelected(null)}
            />
          </div>
          <div
            style={{
              flex: "0 0 auto",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-2xl)",
              padding: 18,
              maxHeight: "48%",
              overflowY: "auto",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {detailPanel}
          </div>
        </div>

        <div
          style={{
            flex: "0 0 40%",
            minWidth: 340,
            maxWidth: 560,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 0,
          }}
        >
          {searchBar(query, setQuery)}
          <SegmentedControl
            options={[...REGIONS]}
            value={region}
            onChange={(r) => changeRegion(r as Region)}
            accents={REGION_ACCENTS}
            size="sm"
          />
          {listHeader(list.length)}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {countryList(list, selected?.iso2 ?? null, (c) => setSelected(c), 3)}
          </div>
        </div>
      </div>

      {/* Mobile: stacked — map, facts strip, then filterable list */}
      <div
        className="flex flex-col md:hidden"
        style={{ flex: 1, minHeight: 0 }}
      >
        <div
          style={{
            height: "32vh",
            minHeight: 200,
            margin: "12px 16px 0",
            borderRadius: "var(--radius-2xl)",
            overflow: "hidden",
            border: "1px solid var(--border-neutral-strong)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <LearningMap
            region={region}
            selectedIso2={selected?.iso2 ?? null}
            onSelect={pickIso2}
            onClear={() => setSelected(null)}
          />
        </div>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-2xl)",
            margin: "10px 16px 0",
            padding: 14,
            maxHeight: 280,
            overflowY: "auto",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {detailPanel}
        </div>

        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {searchBar(query, setQuery)}
          <SegmentedControl
            options={[...REGIONS]}
            value={region}
            onChange={(r) => changeRegion(r as Region)}
            accents={REGION_ACCENTS}
            size="sm"
          />
          {listHeader(list.length)}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          {countryList(list, selected?.iso2 ?? null, (c) => setSelected(c), 2)}
        </div>
      </div>
    </div>
  );
}
