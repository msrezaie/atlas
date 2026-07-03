"use client";

import type { CSSProperties } from "react";

export interface ProgressBarProps {
  value?: number;
  max?: number;
  color?: string;
  height?: number;
  style?: CSSProperties;
}

/** Thin linear progress bar with an animated teal fill. */
export function ProgressBar({
  value = 0,
  max = 100,
  color = "var(--primary)",
  height = 6,
  style = {},
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      style={{
        width: "100%",
        height,
        background: "var(--overlay-2)",
        borderRadius: "var(--radius-full)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: "var(--radius-full)",
          transition: "width var(--dur-slow) var(--ease-out)",
        }}
      />
    </div>
  );
}
