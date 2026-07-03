"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "style"
> {
  /** @default "primary" */
  tone?: "primary" | "neutral" | "amber" | "success" | "danger";
  icon?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
}

const TONES: Record<
  NonNullable<BadgeProps["tone"]>,
  { color: string; bg: string; bd: string }
> = {
  primary: {
    color: "var(--primary)",
    bg: "color-mix(in srgb, var(--primary) 12%, transparent)",
    bd: "color-mix(in srgb, var(--primary) 24%, transparent)",
  },
  neutral: {
    color: "var(--fg-subtle)",
    bg: "var(--overlay-2)",
    bd: "var(--border-neutral)",
  },
  amber: {
    color: "var(--amber-300)",
    bg: "color-mix(in srgb, var(--amber-400) 12%, transparent)",
    bd: "color-mix(in srgb, var(--amber-400) 22%, transparent)",
  },
  success: {
    color: "var(--success)",
    bg: "color-mix(in srgb, var(--success) 14%, transparent)",
    bd: "color-mix(in srgb, var(--success) 24%, transparent)",
  },
  danger: {
    color: "var(--danger)",
    bg: "color-mix(in srgb, var(--danger) 14%, transparent)",
    bd: "color-mix(in srgb, var(--danger) 24%, transparent)",
  },
};

/**
 * Small pill badge — statuses & micro-labels ("Play →", "Soon",
 * "New Best Score"). Tone sets the color; pass an icon for emphasis.
 */
export function Badge({
  tone = "primary",
  icon = null,
  children,
  style = {},
  ...rest
}: BadgeProps) {
  const t = TONES[tone] ?? TONES.primary;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 22,
        padding: "0 10px",
        borderRadius: "var(--radius-full)",
        background: t.bg,
        border: `1px solid ${t.bd}`,
        color: t.color,
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-bold)" as unknown as number,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
