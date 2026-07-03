"use client";

import type { CSSProperties } from "react";

export interface ToggleProps {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  /** @default "md" */
  size?: "sm" | "md";
  style?: CSSProperties;
}

const SIZES = {
  sm: { w: 38, h: 22, k: 16 },
  md: { w: 46, h: 26, k: 20 },
} as const;

/** On/off switch. Teal track when on, neutral when off. */
export function Toggle({
  checked = false,
  onChange,
  disabled = false,
  label,
  size = "md",
  style = {},
}: ToggleProps) {
  const s = SIZES[size] ?? SIZES.md;
  const pad = (s.h - s.k) / 2;

  const sw = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      style={{
        position: "relative",
        width: s.w,
        height: s.h,
        flexShrink: 0,
        borderRadius: "var(--radius-full)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        background: checked ? "var(--primary)" : "var(--switch-background)",
        boxShadow: checked
          ? "var(--glow-primary)"
          : "inset 0 1px 2px rgba(0,0,0,0.4)",
        transition:
          "background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: pad,
          left: checked ? s.w - s.k - pad : pad,
          width: s.k,
          height: s.k,
          borderRadius: "50%",
          background: checked ? "var(--primary-fg)" : "var(--fg-muted)",
          boxShadow: "var(--shadow-sm)",
          transition: "left var(--dur-base) var(--ease-spring)",
        }}
      />
    </button>
  );

  if (!label) return sw;
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {sw}
      <span
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: "var(--weight-medium)" as unknown as number,
          color: "var(--fg)",
        }}
      >
        {label}
      </span>
    </label>
  );
}
