"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Globe, Sparkles, Flag as FlagIcon, Zap } from "lucide-react";
import { IconButton } from "../ui/actions/IconButton";
import { ModeCard } from "../ui/game/ModeCard";
import { Leaderboard } from "../ui/game/Leaderboard";
import { OnlinePill } from "../ui/game/OnlinePill";
import type { GameMode } from "../../lib/gameMode";
import { GAME_MODE_META } from "../../lib/gameMode";

const ICON: Record<GameMode, ReactNode> = {
  find: <Globe size={24} />,
  trivia: <Sparkles size={24} />,
  flag: <FlagIcon size={24} />,
};

const VERSUS_BLURB: Record<GameMode, string> = {
  find: "Race to click the right country first",
  trivia: "Race to answer the AI question first",
  flag: "Race to match the flag first",
};

export interface VersusHubScreenProps {
  onPick: (mode: GameMode) => void;
  onBack: () => void;
}

/**
 * 1v1 hub — pick a game and go straight to matchmaking. No region or
 * round-length config here by design: every 1v1 match is a fixed, fair,
 * 10-country worldwide round, not something to tune beforehand.
 */
export function VersusHubScreen({ onPick, onBack }: VersusHubScreenProps) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, rgba(2,11,24,0.8) 0%, rgba(2,11,24,0.62) 55%, rgba(2,11,24,0.78) 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-neutral)",
        }}
      >
        <IconButton label="Back" onClick={onBack} size="sm">
          <ArrowLeft size={16} />
        </IconButton>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--fg)",
            margin: 0,
          }}
        >
          1v1 Online
        </h1>
        <div style={{ flex: 1 }} />
        <OnlinePill accent="var(--c-asia)" />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "color-mix(in srgb, var(--c-asia) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--c-asia) 26%, transparent)",
            borderRadius: "var(--radius-lg)",
            padding: "10px 14px",
            marginBottom: 4,
          }}
        >
          <span style={{ color: "var(--c-asia)", display: "flex" }}>
            <Zap size={16} />
          </span>
          <p style={{ margin: 0, fontSize: 13, color: "var(--fg-muted)" }}>
            Fixed 10-country worldwide round · fastest correct answer wins.
          </p>
        </div>
        {(Object.keys(GAME_MODE_META) as GameMode[]).map((mode) => (
          <ModeCard
            key={mode}
            icon={ICON[mode]}
            title={GAME_MODE_META[mode].title}
            description={VERSUS_BLURB[mode]}
            onClick={() => onPick(mode)}
          />
        ))}
        <div style={{ marginTop: 6 }}>
          <Leaderboard
            title="Top 1v1 Players"
            accent="var(--c-asia)"
            options={[
              {
                key: "versus_wins",
                filterCol: "versus_games",
                label: "Wins",
                value: (r) => String(r.versus_wins),
                unit: "wins",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
