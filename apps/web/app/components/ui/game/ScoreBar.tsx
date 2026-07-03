"use client";

import type { CSSProperties, ReactNode } from "react";
import { IconButton } from "../actions/IconButton";
import { ProgressBar } from "./ProgressBar";
import { StatPill } from "./StatPill";

export interface ScoreBarProps {
  score?: number;
  streak?: number;
  questionNum?: number;
  total?: number;
  onHome: () => void;
  backIcon?: ReactNode;
  flameIcon?: ReactNode;
  style?: CSSProperties;
}

/**
 * In-game header — back control, question progress, live streak + score.
 * Composes IconButton, ProgressBar and StatPill.
 */
export function ScoreBar({
  score = 0,
  streak = 0,
  questionNum = 1,
  total = 10,
  onHome,
  backIcon = null,
  flameIcon = null,
  style = {},
}: ScoreBarProps) {
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
      <IconButton label="Back to home" onClick={onHome} size="sm">
        {backIcon}
      </IconButton>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-semibold)" as unknown as number,
            color: "var(--fg-subtle)",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {questionNum}/{total}
        </span>
        <ProgressBar
          value={questionNum}
          max={total}
          height={4}
          style={{ flex: 1 }}
        />
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
      >
        {streak >= 2 && (
          <StatPill icon={flameIcon} value={streak} tone="amber" pulse />
        )}
        <span
          style={{
            minWidth: 40,
            textAlign: "right",
            fontFamily: "var(--font-display)",
            fontWeight: "var(--weight-black)" as unknown as number,
            fontSize: "var(--text-xl)",
            color: "var(--primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
