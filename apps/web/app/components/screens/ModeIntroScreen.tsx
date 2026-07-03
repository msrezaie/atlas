"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Sparkles,
  UserRound,
  Swords,
  Zap,
} from "lucide-react";
import type { Region } from "@atlas/types";
import { REGIONS } from "@atlas/data";
import { filterRegion } from "@atlas/game-logic";
import { IconButton } from "../ui/actions/IconButton";
import { Button } from "../ui/actions/Button";
import { SegmentedControl } from "../ui/forms/SegmentedControl";
import { RangeSlider } from "../ui/forms/RangeSlider";
import type { ModeId } from "./LandingScreen";

export type PlayMode = "solo" | "versus";

export interface ModeIntroConfig {
  mode: ModeId;
  play: PlayMode;
  region: Region;
  roundLen: number;
}

export interface ModeIntroScreenProps {
  mode: Exclude<ModeId, "learning">;
  onBack: () => void;
  onStart: (config: ModeIntroConfig) => void;
}

const REGION_ACCENTS: Record<string, string> = {
  Asia: "var(--c-asia)",
  Africa: "var(--c-africa)",
  Americas: "var(--c-americas)",
  Europe: "var(--c-europe)",
  Oceania: "var(--c-oceania)",
};

const META: Record<
  Exclude<ModeId, "learning">,
  { title: string; icon: React.ReactNode; blurb: string }
> = {
  find: {
    title: "Find the Country",
    icon: <Globe size={24} />,
    blurb: "Locate the prompted country on the world map.",
  },
  trivia: {
    title: "Geo Trivia",
    icon: <Sparkles size={24} />,
    blurb: "Answer AI-generated questions by picking the right country.",
  },
};

/** Pick Solo vs 1v1 and configure the round for Find/Trivia. */
export function ModeIntroScreen({
  mode,
  onBack,
  onStart,
}: ModeIntroScreenProps) {
  const [play, setPlay] = useState<PlayMode>("solo");
  const [region, setRegion] = useState<Region>("World");
  const [count, setCount] = useState(10);

  const meta = META[mode];
  const pool = filterRegion(region);
  const maxQ = mode === "trivia" ? 20 : pool.length;
  const roundLen = Math.min(count, maxQ);

  // 1v1 Find the Country skips region/round-length entirely — it's always a
  // fixed, random, worldwide challenge, not something to tune beforehand.
  const fixedWorldRound = mode === "find" && play === "versus";
  const submitRegion: Region = fixedWorldRound ? "World" : region;
  const submitRoundLen = fixedWorldRound ? 10 : roundLen;

  function choice(
    id: PlayMode,
    icon: React.ReactNode,
    title: string,
    sub: string,
    accent: string,
  ) {
    const on = play === id;
    return (
      <button
        type="button"
        onClick={() => setPlay(id)}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "16px 14px",
          textAlign: "left",
          cursor: "pointer",
          borderRadius: "var(--radius-xl)",
          WebkitTapHighlightColor: "transparent",
          background: on
            ? `color-mix(in srgb, ${accent} 14%, transparent)`
            : "var(--overlay-2)",
          border: `1px solid ${on ? accent : "var(--border-neutral)"}`,
          boxShadow: on
            ? `0 0 0 3px color-mix(in srgb, ${accent} 20%, transparent)`
            : "none",
          transition: "all var(--dur-base) var(--ease-out)",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: "var(--radius-md)",
            background: on ? accent : "var(--overlay-3)",
            color: on ? "var(--teal-ink)" : "var(--fg-subtle)",
          }}
        >
          {icon}
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--fg)",
          }}
        >
          {title}
        </span>
        <span
          style={{ fontSize: 12, color: "var(--fg-subtle)", lineHeight: 1.4 }}
        >
          {sub}
        </span>
      </button>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        // Sits over the persistent globe (anchored left/right per mode) —
        // individual controls (cards/pills/inputs) carry their own opaque-ish
        // backgrounds for legibility, so this page-level scrim can stay light
        // enough that the globe's different framing actually reads.
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
          {meta.title}
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
        }}
      >
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
              background: "color-mix(in srgb, var(--primary) 14%, transparent)",
              border: "1px solid var(--border-strong)",
              color: "var(--primary)",
            }}
          >
            {meta.icon}
          </span>
          <p
            style={{
              margin: 0,
              color: "var(--fg-muted)",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {meta.blurb}
          </p>
        </div>

        <div>
          <p className="atlas-eyebrow" style={{ marginBottom: 10 }}>
            Play mode
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {choice(
              "solo",
              <UserRound size={19} />,
              "Solo Practice",
              "Beat your own best score.",
              "var(--primary)",
            )}
            {choice(
              "versus",
              <Swords size={19} />,
              "1v1 Online",
              "Race a live opponent.",
              "var(--c-asia)",
            )}
          </div>
        </div>

        {!fixedWorldRound && (
          <>
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
          </>
        )}

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
            {fixedWorldRound ? (
              <>
                First correct answer{" "}
                <strong style={{ color: "var(--fg)" }}>wins the round</strong>.
                10 countries, picked at random from anywhere in the world.
              </>
            ) : play === "versus" ? (
              <>
                First correct answer{" "}
                <strong style={{ color: "var(--fg)" }}>wins the round</strong>.
                Fastest player takes it.
              </>
            ) : (
              <>
                Answer in <strong style={{ color: "var(--fg)" }}>3s</strong> for{" "}
                <strong style={{ color: "var(--primary)" }}>4 pts</strong> ·
                slower earns fewer · 10s limit.
              </>
            )}
          </p>
        </div>
      </div>

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
          onClick={() =>
            onStart({
              mode,
              play,
              region: submitRegion,
              roundLen: submitRoundLen,
            })
          }
          rightIcon={<ArrowRight size={18} />}
        >
          {play === "versus" ? "Find a Match" : "Start Game"}
        </Button>
      </div>
    </div>
  );
}
