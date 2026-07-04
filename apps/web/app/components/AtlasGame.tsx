"use client";

import { useCallback, useEffect, useState } from "react";
import type { Region } from "@atlas/types";
import { LandingScreen } from "./screens/LandingScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SoloHubScreen } from "./screens/SoloHubScreen";
import { VersusHubScreen } from "./screens/VersusHubScreen";
import { MatchmakingScreen } from "./screens/MatchmakingScreen";
import { FindCountryScreen } from "./screens/FindCountryScreen";
import { TriviaScreen } from "./screens/TriviaScreen";
import { FlagGuesserScreen } from "./screens/FlagGuesserScreen";
import { LearningScreen } from "./screens/LearningScreen";
import { ResultsScreen, type GameResult } from "./screens/ResultsScreen";
import { TiltedGlobe, type GlobeAnchor, type Frame } from "./shared/TiltedGlobe";
import type { GameMode, RoundConfig } from "../lib/gameMode";

type Screen =
  | "landing"
  | "login"
  | "solo-hub"
  | "versus-hub"
  | "matchmaking"
  | "find"
  | "trivia"
  | "flag"
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
  "solo-hub": "left",
  "versus-hub": "right",
  matchmaking: "center",
};

const BEST_KEY = "atlas_best_v2";

function loadBest(): Partial<Record<GameMode, number>> {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function AtlasGame() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [cfg, setCfg] = useState<RoundConfig>({
    mode: "find",
    play: "solo",
    region: "World" as Region,
    roundLen: 10,
  });
  const [opponent, setOpponent] = useState("Mia");
  const [result, setResult] = useState<GameResult | null>(null);
  // The landing page glues the globe to its scroll: it hands up a `getTarget`
  // driver (a ref-reading function, so scrolling never re-renders here) that the
  // shared globe polls each frame. Null when not on the landing.
  const [landingGetTarget, setLandingGetTarget] = useState<
    ((w: number, h: number) => Frame) | null
  >(null);
  // Starts empty (matching the server-rendered HTML) and is filled in from
  // localStorage after mount — reading it in the initial state would give
  // the server and the client's first render different output (server has
  // no `window`, so it always sees `{}`), which is a hydration mismatch.
  const [best, setBest] = useState<Partial<Record<GameMode, number>>>({});

  useEffect(() => {
    setBest(loadBest());
  }, []);

  // Wrap the setter: `getTarget` is a function, and passing a function to a
  // useState setter is interpreted as an updater `(prev) => next`. The extra
  // `() =>` stores the driver itself instead of invoking it. Stable identity so
  // the landing's wiring effect doesn't re-run each render.
  const handleGlobeTarget = useCallback(
    (fn: ((w: number, h: number) => Frame) | null) =>
      setLandingGetTarget(() => fn),
    [],
  );

  function pickVersus(mode: GameMode) {
    // 1v1 skips config entirely — always a fixed, fair, worldwide round.
    setCfg({ mode, play: "versus", region: "World", roundLen: 10 });
    setScreen("matchmaking");
  }

  function startSolo(nextCfg: RoundConfig) {
    setCfg(nextCfg);
    setScreen(nextCfg.mode);
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
    else setScreen(cfg.mode);
  }

  const playProps = {
    play: cfg.play,
    region: cfg.region,
    roundLen: cfg.roundLen,
    opponentName: opponent,
    onHome: () => setScreen("landing"),
  };

  const globeAnchor: GlobeAnchor = GLOBE_ANCHOR[screen] ?? "bottom";
  const showGlobe = screen in GLOBE_ANCHOR;

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
        <TiltedGlobe
          anchor={globeAnchor}
          getTarget={
            screen === "landing" ? (landingGetTarget ?? undefined) : undefined
          }
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
        {screen === "landing" && (
          <LandingScreen
            onSolo={() => setScreen("solo-hub")}
            onVersus={() => setScreen("versus-hub")}
            onExplore={() => setScreen("learning")}
            onSignIn={() => setScreen("login")}
            onGlobeTarget={handleGlobeTarget}
          />
        )}
        {screen === "login" && (
          <LoginScreen
            onBack={() => setScreen("landing")}
            onSignedIn={() => setScreen("landing")}
          />
        )}
        {screen === "solo-hub" && (
          <SoloHubScreen
            best={best}
            onStart={startSolo}
            onBack={() => setScreen("landing")}
          />
        )}
        {screen === "versus-hub" && (
          <VersusHubScreen
            onPick={pickVersus}
            onBack={() => setScreen("landing")}
          />
        )}
        {screen === "matchmaking" && (
          <MatchmakingScreen
            onCancel={() => setScreen("versus-hub")}
            onReady={(opp) => {
              setOpponent(opp);
              setScreen(cfg.mode);
            }}
          />
        )}
        {screen === "find" && (
          <FindCountryScreen {...playProps} onFinish={finish} />
        )}
        {screen === "trivia" && (
          <TriviaScreen {...playProps} onFinish={finish} />
        )}
        {screen === "flag" && (
          <FlagGuesserScreen {...playProps} onFinish={finish} />
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
