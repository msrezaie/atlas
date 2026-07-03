"use client";

import type { CSSProperties, ReactNode } from "react";

export interface DataFieldProps {
  icon?: ReactNode;
  label: string;
  value?: string | number | null;
  style?: CSSProperties;
}

/**
 * Labelled fact row — an icon, an uppercase label, and a value. The atomic
 * unit of country detail panels and info lists.
 */
export function DataField({
  icon = null,
  label,
  value,
  style = {},
}: DataFieldProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        ...style,
      }}
    >
      {icon && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "var(--radius-md)",
            background: "var(--overlay-2)",
            border: "1px solid var(--border-neutral)",
            color: "var(--fg-subtle)",
          }}
        >
          {icon}
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-bold)" as unknown as number,
            letterSpacing: "var(--tracking-wide)",
            textTransform: "uppercase",
            color: "var(--fg-subtle)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-semibold)" as unknown as number,
            color: "var(--fg)",
            fontVariantNumeric: "tabular-nums",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value ?? "—"}
        </div>
      </div>
    </div>
  );
}
