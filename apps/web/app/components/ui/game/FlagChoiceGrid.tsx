"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Flag } from "../display/Flag";

export interface FlagChoiceOption {
  iso2: string;
  name: string;
}

export interface FlagChoiceGridProps {
  options: FlagChoiceOption[];
  value?: string | null;
  states?: Record<string, "correct" | "incorrect">;
  onSelect: (iso2: string) => void;
  disabled?: boolean;
  columns?: number;
  showName?: boolean;
  style?: CSSProperties;
}

/**
 * Grid of selectable flag+name options — the answer input for Geo Trivia
 * and any "pick the country" prompt. Pass `states` to show correct/incorrect
 * feedback after a guess.
 */
export function FlagChoiceGrid({
  options = [],
  value = null,
  states = {},
  onSelect,
  disabled = false,
  columns = 2,
  showName = true,
  style = {},
}: FlagChoiceGridProps) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "var(--space-3)",
        ...style,
      }}
    >
      {options.map((o) => {
        const st = states[o.iso2];
        const selected = value === o.iso2;
        const isHover = hover === o.iso2 && !disabled && !st;

        let border = "var(--border-neutral)";
        let bg = "var(--overlay-2)";
        let ring = "none";
        if (st === "correct") {
          border = "var(--success)";
          bg = "color-mix(in srgb, var(--success) 16%, var(--ink-900))";
          ring = "var(--glow-primary)";
        } else if (st === "incorrect") {
          border = "var(--danger)";
          bg = "color-mix(in srgb, var(--danger) 16%, var(--ink-900))";
        } else if (selected) {
          border = "var(--border-strong)";
          bg = "color-mix(in srgb, var(--primary) 12%, transparent)";
        } else if (isHover) {
          border = "var(--border-strong)";
          bg = "var(--overlay-3)";
        }

        return (
          <button
            key={o.iso2}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onSelect?.(o.iso2)}
            onMouseEnter={() => setHover(o.iso2)}
            onMouseLeave={() => setHover(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-lg)",
              background: bg,
              border: `1px solid ${border}`,
              boxShadow: st === "correct" ? ring : "none",
              cursor: disabled ? "default" : "pointer",
              transform: isHover ? "translateY(-2px)" : "none",
              transition:
                "transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)",
              textAlign: "left",
              WebkitTapHighlightColor: "transparent",
              width: "100%",
            }}
          >
            <Flag iso2={o.iso2} name={o.name} size="md" />
            {showName && (
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-semibold)" as unknown as number,
                  color: "var(--fg)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {o.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
