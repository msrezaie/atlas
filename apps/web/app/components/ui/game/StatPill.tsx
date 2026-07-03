"use client";

import type { CSSProperties, ReactNode } from "react";

export interface StatPillProps {
  icon?: ReactNode;
  value: string | number;
  /** @default "primary" */
  tone?: "primary" | "amber" | "neutral" | "danger";
  pulse?: boolean;
  style?: CSSProperties;
}

const TONES: Record<NonNullable<StatPillProps["tone"]>, string> = {
  primary: "var(--primary)",
  amber: "var(--amber-400)",
  neutral: "var(--fg-muted)",
  danger: "var(--danger)",
};

/**
 * Inline icon + number pill — score (trophy), streak (flame), etc.
 * Compact stat for headers and chips.
 */
export function StatPill({
  icon = null,
  value,
  tone = "primary",
  pulse = false,
  style = {},
}: StatPillProps) {
  const color = TONES[tone] ?? TONES.primary;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color,
        fontFamily: "var(--font-display)",
        fontWeight: "var(--weight-black)" as unknown as number,
        fontSize: "var(--text-base)",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
        animation: pulse
          ? "atlas-pulse 1.2s var(--ease-in-out) infinite"
          : "none",
        ...style,
      }}
    >
      {icon}
      {value}
    </span>
  );
}
