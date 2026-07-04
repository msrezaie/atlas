"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Upload, Pencil, Trash2 } from "lucide-react";
import { COUNTRIES } from "@atlas/data";
import type { Continent } from "@atlas/types";
import { Flag } from "../../components/ui/display/Flag";
import { Tag } from "../../components/ui/display/Tag";
import { Badge } from "../../components/ui/display/Badge";
import { Button } from "../../components/ui/actions/Button";
import { IconButton } from "../../components/ui/actions/IconButton";
import { DataTable, type DataTableColumn } from "../../components/ui/navigation/DataTable";

type CountryStatus = "Draft" | "Published";

type CountryRow = {
  iso2: string;
  name: string;
  continent: Continent;
  capital: string;
  population: number;
  status: CountryStatus;
} & Record<string, unknown>;

const COUNTRY_ROWS: CountryRow[] = COUNTRIES.map(
  (c, i): CountryRow => ({
    iso2: c.iso2,
    name: c.name,
    continent: c.continent,
    capital: c.capital,
    population: c.population,
    status: i % 7 === 3 ? "Draft" : "Published",
  }),
);

const COLUMNS: DataTableColumn<CountryRow>[] = [
  {
    key: "iso2",
    label: "Flag",
    width: 64,
    render: (_value, row) => <Flag iso2={row.iso2} name={row.name} size="sm" />,
  },
  {
    key: "name",
    label: "Country",
    render: (_value, row) => (
      <span style={{ fontWeight: "var(--weight-semibold)" as unknown as number, color: "var(--fg)" }}>
        {row.name}
      </span>
    ),
  },
  {
    key: "continent",
    label: "Continent",
    render: (_value, row) => <Tag continent={row.continent} />,
  },
  {
    key: "capital",
    label: "Capital",
  },
  {
    key: "population",
    label: "Population",
    align: "right",
    numeric: true,
    render: (_value, row) => row.population.toLocaleString(),
  },
  {
    key: "status",
    label: "Status",
    render: (_value, row) => (
      <Badge tone={row.status === "Published" ? "success" : "amber"}>{row.status}</Badge>
    ),
  },
  {
    key: "actions",
    label: "",
    align: "right",
    width: 88,
    render: () => (
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <IconButton label="Edit country" size="sm" onClick={() => {}}>
          <Pencil size={14} />
        </IconButton>
        <IconButton label="Delete country" size="sm" onClick={() => {}}>
          <Trash2 size={14} />
        </IconButton>
      </div>
    ),
  },
];

/** Admin table of every playable country — search, status, row actions. */
export function CountriesPage() {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_ROWS;
    return COUNTRY_ROWS.filter((r) => r.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 360 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-subtle)",
              display: "flex",
              pointerEvents: "none",
            }}
          >
            <Search size={16} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries…"
            style={{
              width: "100%",
              height: 40,
              boxSizing: "border-box",
              padding: "0 12px 0 36px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-input)",
              color: "var(--fg)",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-body)",
              outline: "none",
            }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="secondary" size="sm" leftIcon={<Upload size={15} />} onClick={() => {}}>
          Import CSV
        </Button>
        <Button variant="primary" size="sm" leftIcon={<Plus size={15} />} onClick={() => {}}>
          Add Country
        </Button>
      </div>

      <span style={{ fontSize: "var(--text-sm)", color: "var(--fg-muted)" }}>
        {rows.length} of {COUNTRY_ROWS.length} countries
      </span>

      <DataTable columns={COLUMNS} rows={rows} rowKey="iso2" />
    </div>
  );
}
