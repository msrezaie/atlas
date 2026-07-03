"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: (string | SegmentedOption)[];
  value: string;
  onChange: (value: string) => void;
  /** Per-option accent color (e.g. continent hues), keyed by option value. */
  accents?: Record<string, string> | null;
  /** @default "md" */
  size?: "sm" | "md";
  wrap?: boolean;
  style?: CSSProperties;
}

const SIZES = {
  sm: { h: 30, px: 12, fs: "var(--text-xs)" },
  md: { h: 36, px: 15, fs: "var(--text-sm)" },
} as const;

/**
 * Segmented pill control — single-select from a short list of options.
 * Used for the region filter (World / Asia / Africa …). Pass `accents`
 * to tint the active pill per-option (continent palette).
 */
export function SegmentedControl({
  options = [],
  value,
  onChange,
  accents = null,
  size = "md",
  wrap = true,
  style = {},
}: SegmentedControlProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const norm = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );

  const s = SIZES[size] ?? SIZES.md;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: wrap ? "wrap" : "nowrap",
        gap: 8,
        ...style,
      }}
    >
      {norm.map((o) => {
        const selected = o.value === value;
        const isHover = hovered === o.value;
        const accent = accents?.[o.value];
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange?.(o.value)}
            onMouseEnter={() => setHovered(o.value)}
            onMouseLeave={() => setHovered(null)}
            style={{
              height: s.h,
              padding: `0 ${s.px}px`,
              borderRadius: "var(--radius-full)",
              fontFamily: "var(--font-body)",
              fontSize: s.fs,
              fontWeight: "var(--weight-bold)" as unknown as number,
              lineHeight: 1,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all var(--dur-base) var(--ease-out)",
              border: selected
                ? `1px solid ${accent ? accent : "var(--border-strong)"}`
                : "1px solid var(--border-neutral)",
              background: selected
                ? accent
                  ? `color-mix(in srgb, ${accent} 16%, transparent)`
                  : "var(--surface-elevated)"
                : isHover
                  ? "var(--overlay-2)"
                  : "transparent",
              color: selected
                ? accent
                  ? accent
                  : "var(--primary)"
                : isHover
                  ? "var(--fg)"
                  : "var(--fg-subtle)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
