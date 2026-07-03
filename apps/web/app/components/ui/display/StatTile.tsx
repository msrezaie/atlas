"use client";

import type { CSSProperties, ReactNode } from "react";

export interface StatTileProps {
  value: string | number;
  label: string;
  accent?: boolean;
  icon?: ReactNode;
  style?: CSSProperties;
}

/**
 * Big-number stat tile — the metric blocks on the results screen
 * (Score / Best Streak / Accuracy).
 */
export function StatTile({
  value,
  label,
  accent = false,
  icon = null,
  style = {},
}: StatTileProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "var(--space-4) var(--space-3)",
        background: accent
          ? "color-mix(in srgb, var(--primary) 10%, transparent)"
          : "var(--overlay-2)",
        border: `1px solid ${accent ? "var(--border-strong)" : "var(--border-neutral)"}`,
        borderRadius: "var(--radius-xl)",
        textAlign: "center",
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            color: accent ? "var(--primary)" : "var(--fg-subtle)",
            display: "flex",
          }}
        >
          {icon}
        </div>
      )}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-black)" as unknown as number,
          color: accent ? "var(--primary)" : "var(--fg)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
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
    </div>
  );
}
