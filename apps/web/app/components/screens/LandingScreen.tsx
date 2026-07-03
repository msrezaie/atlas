"use client";

import {
  Globe,
  Sparkles,
  BookOpen,
  UserRound,
  Trophy,
  Play,
  Swords,
} from "lucide-react";
import { Button } from "../ui/actions/Button";
import { ModeCard } from "../ui/game/ModeCard";

export type ModeId = "find" | "trivia" | "learning";

export interface LandingScreenProps {
  best: Partial<Record<ModeId, number>>;
  onPickMode: (mode: ModeId) => void;
  onSignIn: () => void;
}

/**
 * Brand + mode select over the earth-from-space globe (rendered globally by
 * AtlasGame, persistent across screens). Mobile shows a single stacked hero;
 * desktop reveals a nav bar and a wider marketing hero with the mode cards
 * as a row.
 */
export function LandingScreen({
  best,
  onPickMode,
  onSignIn,
}: LandingScreenProps) {
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(2,11,24,0.9) 0%, rgba(2,11,24,0.5) 40%, rgba(2,11,24,0) 62%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 50% 120%, rgba(0,200,168,0.10), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Mobile layout */}
      <div
        className="flex flex-col md:hidden"
        style={{
          position: "relative",
          height: "100%",
          padding: "20px 20px 26px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-mark-teal.png"
              alt="Atlas"
              style={{ width: 30, height: 30 }}
            />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: 20,
                letterSpacing: "-0.02em",
                color: "var(--fg)",
              }}
            >
              Atlas
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignIn}
            leftIcon={<UserRound size={15} />}
          >
            Sign in
          </Button>
        </div>

        <div style={{ marginTop: 30, marginBottom: 22 }}>
          <p
            className="atlas-eyebrow"
            style={{ color: "var(--primary)", marginBottom: 8 }}
          >
            Learn the world
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "var(--fg)",
              margin: 0,
              lineHeight: 1.02,
            }}
          >
            Every country,
            <br />
            one game at a time.
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 11,
            marginTop: "auto",
          }}
        >
          <ModeCard
            icon={<Globe size={24} />}
            title="Find the Country"
            description="Locate countries on the map"
            bestScore={best.find || 0}
            trophyIcon={<Trophy size={14} />}
            onClick={() => onPickMode("find")}
          />
          <ModeCard
            icon={<Sparkles size={24} />}
            title="Geo Trivia"
            description="AI-generated country challenges"
            bestScore={best.trivia || 0}
            trophyIcon={<Trophy size={14} />}
            onClick={() => onPickMode("trivia")}
          />
          <ModeCard
            icon={<BookOpen size={24} />}
            title="Learning Mode"
            description="Explore facts for every country"
            onClick={() => onPickMode("learning")}
          />
        </div>
      </div>

      {/* Desktop layout — wider marketing hero, reuses the globe */}
      <div
        className="hidden md:flex"
        style={{
          position: "relative",
          height: "100%",
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 40px",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            padding: "22px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-mark-teal.png"
              alt="Atlas"
              style={{ width: 32, height: 32 }}
            />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: 22,
                letterSpacing: "-0.02em",
                color: "var(--fg)",
              }}
            >
              Atlas
            </span>
          </div>
          <nav style={{ display: "flex", gap: 26, marginLeft: 12 }}>
            {["Play", "Learn", "Leaderboard"].map((l) => (
              <a
                key={l}
                href="#"
                style={{
                  color: "var(--fg-muted)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {l}
              </a>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" size="sm" onClick={onSignIn}>
            Sign in
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onPickMode("find")}
          >
            Get started
          </Button>
        </header>

        <div style={{ maxWidth: 680, marginTop: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
              border: "1px solid var(--border-strong)",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.02em",
              marginBottom: 22,
            }}
          >
            <Sparkles size={13} /> Now with AI-generated geo challenges
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 60,
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 0.98,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            Master world
            <br />
            geography, the
            <br />
            fun way.
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--fg-muted)",
              lineHeight: 1.6,
              margin: "22px 0 30px",
              maxWidth: 520,
            }}
          >
            Find countries on the map, race friends in 1v1 matches, and explore
            every flag, capital and fact. Premium geography — not a school quiz.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Play size={17} />}
              onClick={() => onPickMode("find")}
            >
              Play for free
            </Button>
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<BookOpen size={17} />}
              onClick={() => onPickMode("learning")}
            >
              Explore countries
            </Button>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            marginBottom: 40,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          <ModeCard
            icon={<Globe size={24} />}
            title="Find the Country"
            description="Locate countries on the map"
            bestScore={best.find || 0}
            trophyIcon={<Trophy size={14} />}
            onClick={() => onPickMode("find")}
          />
          <ModeCard
            icon={<Sparkles size={24} />}
            title="Geo Trivia"
            description="AI-generated challenges"
            bestScore={best.trivia || 0}
            trophyIcon={<Trophy size={14} />}
            onClick={() => onPickMode("trivia")}
          />
          <ModeCard
            icon={<Swords size={24} />}
            title="1v1 Online"
            description="Race a live opponent"
            onClick={() => onPickMode("find")}
          />
        </div>
      </div>
    </div>
  );
}
