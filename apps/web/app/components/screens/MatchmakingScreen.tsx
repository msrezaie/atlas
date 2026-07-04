"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/actions/Button";
import { GlobeSpinner } from "../shared/GlobeSpinner";

export interface MatchmakingScreenProps {
  onReady: (opponent: string) => void;
  onCancel: () => void;
}

const OPPONENTS = [
  "Mia",
  "Kenji",
  "Sofia",
  "Diego",
  "Amara",
  "Liam",
  "Noor",
  "Yuki",
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Brief "finding opponent" simulation, then reveal + hand off. */
export function MatchmakingScreen({
  onReady,
  onCancel,
}: MatchmakingScreenProps) {
  const [phase, setPhase] = useState<"searching" | "found">("searching");
  const [opp] = useState(
    () => OPPONENTS[(Math.random() * OPPONENTS.length) | 0] as string,
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("found"), 1900);
    const t2 = setTimeout(() => onReady(opp), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function puck(label: string, color: string, active: boolean) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "var(--radius-full)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `color-mix(in srgb, ${color} 22%, var(--ink-900))`,
            border: `2px solid ${color}`,
            color,
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: 24,
            boxShadow: active
              ? `0 0 0 6px color-mix(in srgb, ${color} 20%, transparent)`
              : "none",
            transition: "box-shadow var(--dur-slow) var(--ease-out)",
          }}
        >
          {label}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(2,11,24,0.6)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "16px 20px 26px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              className="atlas-eyebrow"
              style={{ color: "var(--primary)", marginBottom: 8 }}
            >
              1v1 Online
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 900,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              {phase === "searching"
                ? "Finding an opponent…"
                : "Opponent found!"}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            {puck("YOU", "var(--primary)", true)}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              {phase === "searching" ? (
                <GlobeSpinner size={40} />
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    color: "var(--fg-faint)",
                    letterSpacing: "0.16em",
                    fontSize: 13,
                  }}
                >
                  VS
                </span>
              )}
            </div>
            {phase === "found" ? (
              puck(initials(opp), "var(--c-asia)", true)
            ) : (
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "var(--radius-full)",
                  border: "2px dashed var(--border-neutral-strong)",
                  animation: "atlas-pulse 1.2s ease-in-out infinite",
                }}
              />
            )}
          </div>

          {phase === "found" && (
            <div
              style={{
                textAlign: "center",
                animation: "atlas-rise var(--dur-slow) var(--ease-out)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--fg)",
                }}
              >
                {opp}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--fg-subtle)",
                  marginTop: 2,
                }}
              >
                Starting match…
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
