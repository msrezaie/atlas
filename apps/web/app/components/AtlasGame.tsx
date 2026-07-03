"use client";

import { useEffect, useState } from "react";
import type { Region } from "@atlas/types";
import { LandingScreen, type ModeId } from "./screens/LandingScreen";
import { LoginScreen } from "./screens/LoginScreen";
import {
  ModeIntroScreen,
  type ModeIntroConfig,
} from "./screens/ModeIntroScreen";
import { MatchmakingScreen } from "./screens/MatchmakingScreen";
import { FindCountryScreen } from "./screens/FindCountryScreen";
import { TriviaScreen } from "./screens/TriviaScreen";
import { LearningScreen } from "./screens/LearningScreen";
import { ResultsScreen, type GameResult } from "./screens/ResultsScreen";
import { TiltedGlobe, type GlobeAnchor } from "./shared/TiltedGlobe";

type Screen =
  | "landing"
  | "login"
  | "intro"
  | "matchmaking"
  | "find"
  | "trivia"
  | "learning"
  | "results";

// Screens that sit over the globe, and which "slice" of it each shows. The
// globe itself is a single persistent instance (see below) — only its
// framing eases between these anchors, so navigating between these screens
// reads as one continuous globe rather than a cut. Screens not listed here
// (gameplay, learning, results) fade it out entirely.
const GLOBE_ANCHOR: Partial<Record<Screen, GlobeAnchor>> = {
  landing: "bottom",
  login: "bottom",
  matchmaking: "center",
};

const BEST_KEY = "atlas_best_v2";

function loadBest(): Partial<Record<ModeId, number>> {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function AtlasGame() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [cfg, setCfg] = useState<ModeIntroConfig>({
    mode: "find",
    play: "solo",
    region: "World" as Region,
    roundLen: 10,
  });
  const [opponent, setOpponent] = useState("Mia");
  const [result, setResult] = useState<GameResult | null>(null);
  // Starts empty (matching the server-rendered HTML) and is filled in from
  // localStorage after mount — reading it in the initial state would give
  // the server and the client's first render different output (server has
  // no `window`, so it always sees `{}`), which is a hydration mismatch.
  const [best, setBest] = useState<Partial<Record<ModeId, number>>>({});

  useEffect(() => {
    setBest(loadBest());
  }, []);

  function pickMode(mode: ModeId) {
    if (mode === "learning") {
      setScreen("learning");
      return;
    }
    setCfg((c) => ({ ...c, mode }));
    setScreen("intro");
  }

  function startFrom(nextCfg: ModeIntroConfig) {
    setCfg(nextCfg);
    if (nextCfg.play === "versus") setScreen("matchmaking");
    else setScreen(nextCfg.mode === "trivia" ? "trivia" : "find");
  }

  function finish(r: GameResult) {
    setResult(r);
    if (r.play === "solo" && r.score > (best[r.mode] || 0)) {
      const nb = { ...best, [r.mode]: r.score };
      setBest(nb);
      localStorage.setItem(BEST_KEY, JSON.stringify(nb));
    }
    setScreen("results");
  }

  function replay() {
    if (cfg.play === "versus") setScreen("matchmaking");
    else setScreen(cfg.mode === "trivia" ? "trivia" : "find");
  }

  const playProps = {
    play: cfg.play,
    region: cfg.region,
    roundLen: cfg.roundLen,
    opponentName: opponent,
    onHome: () => setScreen("landing"),
  };

  // "intro" is shared by both Find the Country and Geo Trivia, so it needs
  // its own anchor per mode rather than a single static entry in the table —
  // find peeks from the left, trivia from the right.
  const globeAnchor: GlobeAnchor =
    screen === "intro"
      ? cfg.mode === "trivia"
        ? "right"
        : "left"
      : (GLOBE_ANCHOR[screen] ?? "bottom");
  const showGlobe = screen in GLOBE_ANCHOR || screen === "intro";

  return (
    <div style={{ height: "100dvh", overflow: "hidden", position: "relative" }}>
      {/* Persistent across every screen — never remounts, so spin phase and
          starfield carry over; only the framing eases toward the active
          screen's anchor. Screens that don't want it just fade it to 0. */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          opacity: showGlobe ? 1 : 0,
          transition: "opacity 600ms ease-out",
          pointerEvents: "none",
        }}
      >
        <TiltedGlobe anchor={globeAnchor} />
      </div>

      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
        {screen === "landing" && (
          <LandingScreen
            best={best}
            onPickMode={pickMode}
            onSignIn={() => setScreen("login")}
          />
        )}
        {screen === "login" && (
          <LoginScreen
            onBack={() => setScreen("landing")}
            onSignedIn={() => setScreen("landing")}
          />
        )}
        {screen === "intro" && cfg.mode !== "learning" && (
          <ModeIntroScreen
            mode={cfg.mode}
            onBack={() => setScreen("landing")}
            onStart={startFrom}
          />
        )}
        {screen === "matchmaking" && (
          <MatchmakingScreen
            onCancel={() => setScreen("intro")}
            onReady={(opp) => {
              setOpponent(opp);
              setScreen(cfg.mode === "trivia" ? "trivia" : "find");
            }}
          />
        )}
        {screen === "find" && (
          <FindCountryScreen {...playProps} onFinish={finish} />
        )}
        {screen === "trivia" && (
          <TriviaScreen {...playProps} onFinish={finish} />
        )}
        {screen === "learning" && (
          <LearningScreen onHome={() => setScreen("landing")} />
        )}
        {screen === "results" && result && (
          <ResultsScreen
            result={result}
            best={best[result.mode] || 0}
            onPlayAgain={replay}
            onHome={() => setScreen("landing")}
          />
        )}
      </div>
    </div>
  );
}
