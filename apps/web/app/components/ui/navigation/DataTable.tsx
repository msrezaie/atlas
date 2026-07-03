"use client";

import type { CSSProperties, ReactNode } from "react";

export interface DataTableColumn<Row> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string | number;
  numeric?: boolean;
  wrap?: boolean;
  render?: (value: unknown, row: Row) => ReactNode;
}

export interface DataTableProps<Row extends Record<string, unknown>> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey?: keyof Row & string;
  onRowClick?: (row: Row) => void;
  style?: CSSProperties;
}

/**
 * Data table for admin lists — countries, users, config rows. Columns drive
 * everything; pass a `render` for custom cells (flags, badges, actions).
 */
export function DataTable<Row extends Record<string, unknown>>({
  columns = [],
  rows = [],
  rowKey = "id" as keyof Row & string,
  onRowClick,
  style = {},
}: DataTableProps<Row>) {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        border: "1px solid var(--border-neutral)",
        borderRadius: "var(--radius-xl)",
        background: "var(--surface)",
        ...style,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-body)",
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align || "left",
                  padding: "12px 16px",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-bold)" as unknown as number,
                  letterSpacing: "var(--tracking-wide)",
                  textTransform: "uppercase",
                  color: "var(--fg-subtle)",
                  borderBottom: "1px solid var(--border-neutral)",
                  whiteSpace: "nowrap",
                  width: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={String(row[rowKey] ?? ri)}
              onClick={() => onRowClick?.(row)}
              style={{
                cursor: onRowClick ? "pointer" : "default",
                transition: "background var(--dur-fast) var(--ease-out)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--overlay-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.align || "left",
                    padding: "13px 16px",
                    fontSize: "var(--text-sm)",
                    color: "var(--fg)",
                    borderBottom:
                      ri === rows.length - 1
                        ? "none"
                        : "1px solid var(--border-neutral)",
                    fontVariantNumeric: col.numeric ? "tabular-nums" : "normal",
                    whiteSpace: col.wrap ? "normal" : "nowrap",
                  }}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : ((row[col.key] as ReactNode) ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
