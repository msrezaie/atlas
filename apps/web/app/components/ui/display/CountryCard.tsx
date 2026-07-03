"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Country } from "@atlas/types";
import { Flag } from "./Flag";
import { Tag } from "./Tag";

export interface CountryCardProps {
  country: Country;
  interactive?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

function fmtPop(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1e9)
    return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1).replace(/\.0$/, "") + "B";
  if (n >= 1e6)
    return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "K";
  return String(n);
}
function fmtArea(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString() + " km²";
}

/**
 * Country fact card — flag + name + capital, with optional population /
 * area / continent facts. Composes Flag and Tag.
 */
export function CountryCard({
  country,
  interactive = false,
  onClick,
  style = {},
}: CountryCardProps) {
  const [hover, setHover] = useState(false);
  const c = country;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        background: "var(--surface)",
        border: `1px solid ${interactive && hover ? "var(--border-strong)" : "var(--border)"}`,
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-5)",
        boxShadow: "var(--shadow-card)",
        transform: interactive && hover ? "translateY(-2px)" : "none",
        transition:
          "transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
        cursor: interactive ? "pointer" : "default",
        ...style,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
      >
        <Flag iso2={c.iso2} name={c.name} size="lg" />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              fontWeight: "var(--weight-bold)" as unknown as number,
              color: "var(--fg)",
              lineHeight: 1.2,
            }}
          >
            {c.name}
          </div>
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--fg-subtle)",
              marginTop: 2,
            }}
          >
            {c.capital}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
        }}
      >
        {c.continent && <Tag continent={c.continent} />}
        <div style={{ display: "flex", gap: "var(--space-5)" }}>
          <Fact label="Pop" value={fmtPop(c.population)} />
          <Fact label="Area" value={fmtArea(c.area)} />
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--weight-bold)" as unknown as number,
          color: "var(--fg)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: "var(--weight-bold)" as unknown as number,
          letterSpacing: "var(--tracking-wide)",
          textTransform: "uppercase",
          color: "var(--fg-subtle)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
