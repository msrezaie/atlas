"use client";

import { useEffect, useState } from "react";
import { MATCH_REVEAL_MS } from "@atlas/game-logic/matchmaking";
import { Button } from "../ui/actions/Button";
import { GlobeSpinner } from "../shared/GlobeSpinner";
import { OnlinePill } from "../ui/game/OnlinePill";
import { useMatchmaking } from "../../lib/match/useMatchmaking";
import type { MatchInfo } from "../../lib/match/types";
import type { GameMode } from "../../lib/gameMode";

export interface MatchmakingScreenProps {
  mode: GameMode;
  onReady: (match: MatchInfo) => void;
  onCancel: () => void;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Real matchmaking: enter the queue, pair with a waiting player over realtime,
 * or fall back to a bot after the search window. Reveals the opponent, then
 * hands the resolved match off to start the game.
 */
export function MatchmakingScreen({ mode, onReady, onCancel }: MatchmakingScreenProps) {
  const match = useMatchmaking(mode);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!match) return;
    setRevealed(true);
    const t = setTimeout(() => onReady(match), MATCH_REVEAL_MS || 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match]);

  const phase = revealed && match ? "found" : "searching";
  const opp = match?.opponentName ?? "";
  const isBot = match?.isBot ?? false;

  function puck(label: string, color: string, active: boolean) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
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
            <p className="atlas-eyebrow" style={{ color: "var(--primary)", marginBottom: 8 }}>
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
                : isBot
                  ? "Matched with a bot"
                  : "Opponent found!"}
            </h1>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
              <OnlinePill accent="var(--c-asia)" />
            </div>
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--fg)",
                  }}
                >
                  {opp}
                </span>
                {isBot && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--c-asia)",
                      background: "color-mix(in srgb, var(--c-asia) 16%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--c-asia) 40%, transparent)",
                      borderRadius: "var(--radius-full)",
                      padding: "1px 7px",
                    }}
                  >
                    Bot
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-subtle)", marginTop: 2 }}>
                Starting match…
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
