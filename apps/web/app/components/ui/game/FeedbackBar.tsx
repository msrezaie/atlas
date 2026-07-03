"use client";

import type { CSSProperties, ReactNode } from "react";

export interface FeedbackBarProps {
  status?: "correct" | "incorrect" | null;
  correctAnswer?: string;
  icon?: ReactNode;
  style?: CSSProperties;
}

/**
 * Answer feedback bar — slides in green for correct, red for incorrect.
 * Collapses to zero height when status is null.
 */
export function FeedbackBar({
  status = null,
  correctAnswer,
  icon = null,
  style = {},
}: FeedbackBarProps) {
  const active = status === "correct" || status === "incorrect";
  const isOk = status === "correct";
  return (
    <div
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: active ? 44 : 0,
        opacity: active ? 1 : 0,
        overflow: "hidden",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-bold)" as unknown as number,
        background: isOk
          ? "color-mix(in srgb, var(--success) 22%, var(--ink-950))"
          : "color-mix(in srgb, var(--danger) 22%, var(--ink-950))",
        color: isOk ? "#bbf7d0" : "#fecaca",
        borderTop: `1px solid ${isOk ? "color-mix(in srgb, var(--success) 40%, transparent)" : "color-mix(in srgb, var(--danger) 40%, transparent)"}`,
        transition:
          "height var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out)",
        ...style,
      }}
    >
      {active && icon}
      {isOk
        ? "Correct!"
        : active && (
            <span>
              It was{" "}
              <strong style={{ marginLeft: 2, color: "var(--fg)" }}>
                {correctAnswer}
              </strong>
            </span>
          )}
    </div>
  );
}
