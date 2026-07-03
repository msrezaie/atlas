"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export interface ModeCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  locked?: boolean;
  bestScore?: number;
  onClick?: () => void;
  trophyIcon?: ReactNode;
  lockIcon?: ReactNode;
  style?: CSSProperties;
}

/**
 * Game-mode selector card — the hero list item on the Atlas home screen.
 * Active modes are teal-tinted and clickable; locked modes are dimmed.
 */
export function ModeCard({
  icon = null,
  title,
  description,
  locked = false,
  bestScore = 0,
  onClick,
  trophyIcon = null,
  lockIcon = null,
  style = {},
}: ModeCardProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const clickable = !locked;

  return (
    <button
      type="button"
      disabled={locked}
      onClick={clickable ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        width: "100%",
        textAlign: "left",
        padding: "var(--space-5)",
        borderRadius: "var(--radius-2xl)",
        cursor: locked ? "not-allowed" : "pointer",
        opacity: locked ? 0.4 : 1,
        background: locked
          ? "var(--overlay-1)"
          : "linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), color-mix(in srgb, var(--c-europe) 5%, transparent))",
        border: `1px solid ${locked ? "var(--border-neutral)" : hover ? "var(--border-strong)" : "color-mix(in srgb, var(--primary) 18%, transparent)"}`,
        boxShadow: locked
          ? "none"
          : hover
            ? "var(--shadow-lg)"
            : "var(--shadow-card)",
        transform:
          active && clickable
            ? "scale(var(--press-scale))"
            : hover && clickable
              ? "scale(var(--hover-lift))"
              : "scale(1)",
        transition:
          "transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 46,
          height: 46,
          flexShrink: 0,
          borderRadius: "var(--radius-lg)",
          background: locked
            ? "var(--overlay-2)"
            : "color-mix(in srgb, var(--primary) 16%, transparent)",
          border: `1px solid ${locked ? "var(--border-neutral)" : "color-mix(in srgb, var(--primary) 20%, transparent)"}`,
          color: locked ? "var(--fg-subtle)" : "var(--primary)",
        }}
      >
        {icon}
      </span>

      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-display)",
            fontWeight: "var(--weight-bold)" as unknown as number,
            fontSize: "var(--text-base)",
            color: "var(--fg)",
          }}
        >
          {title}
        </span>
        <span
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            color: "var(--fg-subtle)",
            marginTop: 2,
          }}
        >
          {description}
        </span>
      </span>

      <span
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {locked ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-semibold)" as unknown as number,
              color: "var(--fg-subtle)",
            }}
          >
            {lockIcon} Soon
          </span>
        ) : (
          <>
            {bestScore > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--amber-400)",
                  fontFamily: "var(--font-display)",
                  fontWeight: "var(--weight-black)" as unknown as number,
                  fontSize: "var(--text-sm)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {trophyIcon} {bestScore}
              </span>
            )}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 22,
                padding: "0 10px",
                borderRadius: "var(--radius-full)",
                background:
                  "color-mix(in srgb, var(--primary) 14%, transparent)",
                color: "var(--primary)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-bold)" as unknown as number,
              }}
            >
              Play →
            </span>
          </>
        )}
      </span>
    </button>
  );
}
