"use client";

import type { CSSProperties } from "react";
import type { Country } from "@atlas/types";
import { Flag } from "./Flag";
import { DataField, type DataFieldProps } from "./DataField";
import { Tag } from "./Tag";

export type CountryDetailField = Pick<
  DataFieldProps,
  "icon" | "label" | "value"
>;

export interface CountryDetailProps {
  country: Country;
  fields?: CountryDetailField[];
  columns?: number;
  style?: CSSProperties;
}

/**
 * Country detail panel for Learning mode — big flag + name header over a
 * grid of DataFields. `fields` is an ordered list so callers control which
 * facts (capital, population, language, currency, area…) appear and how
 * they're formatted.
 */
export function CountryDetail({
  country,
  fields = [],
  columns = 2,
  style = {},
}: CountryDetailProps) {
  const c = country;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
        ...style,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}
      >
        <Flag iso2={c.iso2} name={c.name} size="xl" />
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-2xl)",
              fontWeight: "var(--weight-extrabold)" as unknown as number,
              color: "var(--fg)",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {c.name}
          </h2>
          {c.continent && (
            <div style={{ marginTop: 8 }}>
              <Tag continent={c.continent} />
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "var(--space-4) var(--space-5)",
        }}
      >
        {fields.map((f, i) => (
          <DataField key={i} icon={f.icon} label={f.label} value={f.value} />
        ))}
      </div>
    </div>
  );
}
