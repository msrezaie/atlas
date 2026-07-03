"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export interface SideNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

export interface SideNavProps {
  items: SideNavItem[];
  active: string;
  onSelect: (id: string) => void;
  brand?: string;
  logoSrc?: string;
  footer?: ReactNode;
  width?: number;
  style?: CSSProperties;
}

/**
 * Vertical navigation rail for the Atlas admin dashboard. Brand lockup at
 * top, a list of icon+label items, active item highlighted in teal.
 */
export function SideNav({
  items = [],
  active,
  onSelect,
  brand = "Atlas",
  logoSrc,
  footer = null,
  width = 240,
  style = {},
}: SideNavProps) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <nav
      style={{
        width,
        flexShrink: 0,
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        background: "var(--ink-900)",
        borderRight: "1px solid var(--border-neutral)",
        padding: "var(--space-5) var(--space-3)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 var(--space-3) var(--space-6)",
        }}
      >
        {logoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoSrc} alt="" style={{ width: 30, height: 30 }} />
        )}
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: "var(--weight-black)" as unknown as number,
            fontSize: "var(--text-xl)",
            letterSpacing: "-0.02em",
            color: "var(--fg)",
          }}
        >
          {brand}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: "var(--weight-bold)" as unknown as number,
            letterSpacing: "var(--tracking-widest)",
            textTransform: "uppercase",
            color: "var(--primary)",
            background: "color-mix(in srgb, var(--primary) 14%, transparent)",
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          Admin
        </span>
      </div>

      <div
        style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}
      >
        {items.map((it) => {
          const on = it.id === active;
          const hv = hover === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelect?.(it.id)}
              onMouseEnter={() => setHover(it.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "10px var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                background: on
                  ? "color-mix(in srgb, var(--primary) 14%, transparent)"
                  : hv
                    ? "var(--overlay-2)"
                    : "transparent",
                color: on
                  ? "var(--primary)"
                  : hv
                    ? "var(--fg)"
                    : "var(--fg-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: (on
                  ? "var(--weight-bold)"
                  : "var(--weight-medium)") as unknown as number,
                transition:
                  "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)",
                position: "relative",
              }}
            >
              {on && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 3,
                    background: "var(--primary)",
                  }}
                />
              )}
              <span style={{ display: "flex", flexShrink: 0 }}>{it.icon}</span>
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.badge != null && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: "var(--weight-bold)" as unknown as number,
                    color: on ? "var(--primary)" : "var(--fg-subtle)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {it.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {footer && (
        <div
          style={{
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--border-neutral)",
          }}
        >
          {footer}
        </div>
      )}
    </nav>
  );
}
