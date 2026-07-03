"use client";

import type { ReactNode } from "react";
import {
  Trophy,
  Handshake,
  Flag as FlagIcon,
  Award,
  Star,
  Globe,
} from "lucide-react";
import { Card } from "../ui/display/Card";
import { Button } from "../ui/actions/Button";
import { StatTile } from "../ui/display/StatTile";
import { Badge } from "../ui/display/Badge";
import type { FindCountryResult } from "./FindCountryScreen";
import type { TriviaResult } from "./TriviaScreen";

export type GameResult = FindCountryResult | TriviaResult;

export interface ResultsScreenProps {
  result: GameResult;
  best: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

/** Round summary for solo and versus play. */
export function ResultsScreen({
  result,
  best,
  onPlayAgain,
  onHome,
}: ResultsScreenProps) {
  const versus = result.play === "versus";
  const acc = result.total
    ? Math.round((result.correct / result.total) * 100)
    : 0;

  const won = versus && result.score > result.oppScore;
  const tie = versus && result.score === result.oppScore;
  const isNewBest = !versus && result.score > 0 && result.score >= (best || 0);

  const headMark: ReactNode = versus ? (
    won ? (
      <Trophy size={30} />
    ) : tie ? (
      <Handshake size={30} />
    ) : (
      <FlagIcon size={30} />
    )
  ) : acc >= 90 ? (
    <Award size={30} />
  ) : acc >= 70 ? (
    <Star size={30} />
  ) : (
    <Globe size={30} />
  );
  const headColor = versus
    ? won
      ? "var(--amber-400)"
      : tie
        ? "var(--fg-muted)"
        : "var(--fg-subtle)"
    : "var(--amber-400)";
  const title = versus
    ? won
      ? "Victory!"
      : tie
        ? "It's a draw"
        : "Defeated"
    : "Round Complete";

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card glow padding="xl" style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 14px",
              borderRadius: "var(--radius-2xl)",
              background: `color-mix(in srgb, ${headColor} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${headColor} 26%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: headColor,
            }}
          >
            {headMark}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 900,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          {isNewBest && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Badge tone="amber" icon={<Trophy size={14} />}>
                New Best Score!
              </Badge>
            </div>
          )}
        </div>

        {versus ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 10,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <StatTile value={result.score} label="You" accent={won} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                color: "var(--fg-faint)",
                fontSize: 13,
              }}
            >
              VS
            </span>
            <StatTile
              value={result.oppScore}
              label={result.opponentName || "Opponent"}
              accent={!won && !tie}
            />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <StatTile value={result.score} label="Score" accent />
            <StatTile value={result.longestStreak} label="Best Streak" />
            <StatTile value={`${acc}%`} label="Accuracy" />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button variant="primary" size="lg" fullWidth onClick={onPlayAgain}>
            Play Again
          </Button>
          <Button variant="ghost" fullWidth onClick={onHome}>
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
