"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { Continent } from "@atlas/types";

export interface TagProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "style"
> {
  continent?: Continent;
  color?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

const CONTINENT_COLOR: Record<Continent, string> = {
  Americas: "var(--c-americas)",
  Europe: "var(--c-europe)",
  Africa: "var(--c-africa)",
  Asia: "var(--c-asia)",
  Oceania: "var(--c-oceania)",
};

/**
 * Continent tag — a colored dot + label. Pass `continent` to auto-pick
 * the cartographic hue, or `color` to override.
 */
export function Tag({
  continent,
  color,
  children,
  style = {},
  ...rest
}: TagProps) {
  const dot =
    color || (continent && CONTINENT_COLOR[continent]) || "var(--primary)";
  const label = children ?? continent;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 10px 0 8px",
        borderRadius: "var(--radius-full)",
        background: "var(--overlay-2)",
        border: "1px solid var(--border-neutral)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-semibold)" as unknown as number,
        color: "var(--fg-muted)",
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
