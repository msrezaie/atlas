"use client";

import type { CSSProperties } from "react";

export interface VersusPlayer {
  name: string;
  score: number;
}

export interface VersusBarProps {
  you?: VersusPlayer;
  opponent?: VersusPlayer;
  round?: number;
  total?: number;
  youColor?: string;
  opponentColor?: string;
  style?: CSSProperties;
}

function Initials({
  name,
  color,
  active,
}: {
  name: string;
  color: string;
  active: boolean;
}) {
  const chars = String(name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        flexShrink: 0,
        borderRadius: "var(--radius-full)",
        background: `color-mix(in srgb, ${color} 22%, var(--ink-900))`,
        border: `1.5px solid ${active ? color : "transparent"}`,
        boxShadow: active
          ? `0 0 0 3px color-mix(in srgb, ${color} 22%, transparent)`
          : "none",
        color,
        fontFamily: "var(--font-display)",
        fontWeight: "var(--weight-black)" as unknown as number,
        fontSize: "var(--text-sm)",
        transition: "box-shadow var(--dur-base) var(--ease-out)",
      }}
    >
      {chars}
    </span>
  );
}

/**
 * Shared-race multiplayer header — two players either side of a live VS,
 * each with a name, score and turn/lead indicator. Use above a shared map
 * or choice grid where the first to answer correctly wins the round.
 */
export function VersusBar({
  you = { name: "You", score: 0 },
  opponent = { name: "Opponent", score: 0 },
  round = 1,
  total = 10,
  youColor = "var(--primary)",
  opponentColor = "var(--c-asia)",
  style = {},
}: VersusBarProps) {
  const youLead = you.score > opponent.score;
  const oppLead = opponent.score > you.score;

  const side = (
    p: VersusPlayer,
    color: string,
    lead: boolean,
    align: "left" | "right",
  ) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        flex: 1,
        flexDirection: align === "right" ? "row-reverse" : "row",
        minWidth: 0,
      }}
    >
      <Initials name={p.name} color={color} active={lead} />
      <div style={{ minWidth: 0, textAlign: align }}>
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-semibold)" as unknown as number,
            color: "var(--fg-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
            fontWeight: "var(--weight-black)" as unknown as number,
            color,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {p.score}
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        background: "color-mix(in srgb, var(--ink-950) 90%, transparent)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-neutral)",
        ...style,
      }}
    >
      {side(you, youColor, youLead, "left")}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-black)" as unknown as number,
            letterSpacing: "var(--tracking-widest)",
            color: "var(--fg-faint)",
          }}
        >
          VS
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: "var(--weight-bold)" as unknown as number,
            color: "var(--fg-subtle)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {round}/{total}
        </span>
      </div>
      {side(opponent, opponentColor, oppLead, "right")}
    </div>
  );
}
