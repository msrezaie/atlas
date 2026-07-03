"use client";

import type { CSSProperties } from "react";

export interface RangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
  minLabel?: string;
  maxLabel?: string;
  style?: CSSProperties;
}

/**
 * Labelled range slider with a teal fill + thumb. Wraps a native
 * input[type=range] so it stays accessible and keyboard-operable.
 */
export function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  label,
  showValue = true,
  minLabel,
  maxLabel,
  style = {},
}: RangeSliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div style={{ width: "100%", ...style }}>
      {(label || showValue) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          {label && (
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-bold)" as unknown as number,
                letterSpacing: "var(--tracking-widest)",
                textTransform: "uppercase",
                color: "var(--fg-subtle)",
              }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-black)" as unknown as number,
                color: "var(--primary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {value}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        className="atlas-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--primary) ${pct}%, var(--overlay-2) ${pct}%)`,
        }}
      />
      {(minLabel || maxLabel) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
            fontSize: "var(--text-xs)",
            color: "var(--fg-subtle)",
          }}
        >
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
