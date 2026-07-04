"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Sparkles,
  Flag as FlagIcon,
  Trophy,
  Zap,
} from "lucide-react";
import type { Region } from "@atlas/types";
import { REGIONS } from "@atlas/data";
import { filterRegion } from "@atlas/game-logic";
import { IconButton } from "../ui/actions/IconButton";
import { Button } from "../ui/actions/Button";
import { ModeCard } from "../ui/game/ModeCard";
import { SegmentedControl } from "../ui/forms/SegmentedControl";
import { RangeSlider } from "../ui/forms/RangeSlider";
import type { GameMode, RoundConfig } from "../../lib/gameMode";
import { GAME_MODE_META } from "../../lib/gameMode";

const ICON: Record<GameMode, ReactNode> = {
  find: <Globe size={24} />,
  trivia: <Sparkles size={24} />,
  flag: <FlagIcon size={24} />,
};

const BLURB: Record<GameMode, string> = {
  find: "Locate the prompted country on the world map.",
  trivia: "Answer AI-generated questions by picking the right country.",
  flag: "Match flags to countries — some rounds ask you to type the name.",
};

const REGION_ACCENTS: Record<string, string> = {
  Asia: "var(--c-asia)",
  Africa: "var(--c-africa)",
  Americas: "var(--c-americas)",
  Europe: "var(--c-europe)",
  Oceania: "var(--c-oceania)",
};

export interface SoloHubScreenProps {
  best: Partial<Record<GameMode, number>>;
  onStart: (config: RoundConfig) => void;
  onBack: () => void;
}

/**
 * Solo practice hub. Picking a game reveals its config *in place* — same
 * screen, same globe framing — rather than routing to a separate intro screen,
 * so the globe never re-anchors mid-flow. Back from the config returns to the
 * picker; back from the picker leaves the hub.
 */
export function SoloHubScreen({ best, onStart, onBack }: SoloHubScreenProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [region, setRegion] = useState<Region>("World");
  const [count, setCount] = useState(10);

  const maxQ = mode === "find" ? filterRegion(region).length : 20;
  const roundLen = Math.min(count, maxQ);

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
        <IconButton
          label="Back"
          size="sm"
          onClick={() => (mode ? setMode(null) : onBack())}
        >
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
          {mode ? GAME_MODE_META[mode].title : "Solo Practice"}
        </h1>
      </div>

      {/* Keyed so the content re-animates when switching between picker/config. */}
      <div
        key={mode ?? "picker"}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: mode ? 22 : 12,
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          animation: "atlas-rise var(--dur-base) var(--ease-out)",
        }}
      >
        {mode === null ? (
          <>
            <p
              style={{ color: "var(--fg-muted)", fontSize: 14, margin: "0 0 6px" }}
            >
              Pick a game, then set your region and round length.
            </p>
            {(Object.keys(GAME_MODE_META) as GameMode[]).map((m) => (
              <ModeCard
                key={m}
                icon={ICON[m]}
                title={GAME_MODE_META[m].title}
                description={GAME_MODE_META[m].description}
                bestScore={best[m] || 0}
                trophyIcon={<Trophy size={14} />}
                onClick={() => setMode(m)}
              />
            ))}
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: "var(--radius-xl)",
                  background:
                    "color-mix(in srgb, var(--primary) 14%, transparent)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--primary)",
                }}
              >
                {ICON[mode]}
              </span>
              <p
                style={{
                  margin: 0,
                  color: "var(--fg-muted)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {BLURB[mode]}
              </p>
            </div>

            <div>
              <p className="atlas-eyebrow" style={{ marginBottom: 10 }}>
                Region
              </p>
              <SegmentedControl
                options={[...REGIONS]}
                value={region}
                onChange={(r) => setRegion(r as Region)}
                accents={REGION_ACCENTS}
                size="sm"
              />
            </div>

            <RangeSlider
              label="Questions"
              min={5}
              max={maxQ}
              value={roundLen}
              onChange={setCount}
              minLabel="5"
              maxLabel={`${maxQ}`}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-lg)",
                padding: "12px 16px",
              }}
            >
              <span style={{ color: "var(--primary)" }}>
                <Zap size={18} />
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--fg-muted)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Answer in <strong style={{ color: "var(--fg)" }}>3s</strong> for{" "}
                <strong style={{ color: "var(--primary)" }}>4 pts</strong> ·
                slower earns fewer · 10s limit.
              </p>
            </div>
          </>
        )}
      </div>

      {mode && (
        <div
          style={{
            padding: "12px 20px 22px",
            borderTop: "1px solid var(--border-neutral)",
            maxWidth: 480,
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight size={18} />}
            onClick={() => onStart({ mode, play: "solo", region, roundLen })}
          >
            Start Game
          </Button>
        </div>
      )}
    </div>
  );
}
