"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Search,
  MapPin,
  Users,
  Languages,
  Coins,
  Ruler,
  Compass,
} from "lucide-react";
import type { Country, Region } from "@atlas/types";
import { COUNTRIES, REGIONS, getCountryFacts } from "@atlas/data";
import { IconButton } from "../ui/actions/IconButton";
import { SegmentedControl } from "../ui/forms/SegmentedControl";
import { CountryDetail } from "../ui/display/CountryDetail";
import { Flag } from "../ui/display/Flag";
import { Button } from "../ui/actions/Button";

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

function detailFields(c: Country) {
  const facts = getCountryFacts(c.iso2);
  return [
    { icon: <MapPin size={16} />, label: "Capital", value: c.capital },
    {
      icon: <Users size={16} />,
      label: "Population",
      value: fmtPop(c.population),
    },
    { icon: <Languages size={16} />, label: "Language", value: facts.language },
    { icon: <Coins size={16} />, label: "Currency", value: facts.currency },
    {
      icon: <Ruler size={16} />,
      label: "Area",
      value: c.area.toLocaleString() + " km²",
    },
    { icon: <Compass size={16} />, label: "Continent", value: c.continent },
  ];
}

/** Browse every country as a tile grid; tap for a full detail sheet. */
export function LearningScreen({ onHome }: LearningScreenProps) {
  const [region, setRegion] = useState<Region>("World");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);

  const list = COUNTRIES.filter(
    (c) => region === "World" || c.continent === region,
  )
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--border-neutral)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            Learning Mode
          </h1>
          <span
            style={{
              fontSize: 12,
              color: "var(--fg-subtle)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {list.length}
          </span>
        </div>
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
            onChange={(e) => setQuery(e.target.value)}
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
        <SegmentedControl
          options={[...REGIONS]}
          value={region}
          onChange={(r) => setRegion(r as Region)}
          accents={REGION_ACCENTS}
          size="sm"
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {list.map((c) => (
            <button
              key={c.iso2}
              type="button"
              onClick={() => setSelected(c)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 14,
                textAlign: "left",
                cursor: "pointer",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "var(--shadow-card)",
                WebkitTapHighlightColor: "transparent",
                transition:
                  "transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <Flag iso2={c.iso2} name={c.name} size="lg" />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--fg)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--fg-subtle)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  <MapPin size={11} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.capital}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            background: "var(--scrim)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "flex-end",
            animation: "atlas-fade var(--dur-base) var(--ease-out)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
              background: "var(--surface)",
              borderTop: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-3xl) var(--radius-3xl) 0 0",
              padding: "20px 20px 24px",
              boxShadow: "var(--shadow-xl)",
              animation: "atlas-sheet var(--dur-slow) var(--ease-out)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: "var(--border-neutral-strong)",
                }}
              />
            </div>
            <CountryDetail
              country={selected}
              fields={detailFields(selected)}
              columns={2}
            />
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setSelected(null)}
              style={{ marginTop: 20 }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
