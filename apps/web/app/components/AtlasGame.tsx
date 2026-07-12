"use client";

import { useCallback, useEffect, useState } from "react";
import type { Region } from "@atlas/types";
import { LandingScreen } from "./screens/LandingScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { AccountScreen } from "./screens/AccountScreen";
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
import type { MatchInfo } from "../lib/match/types";
import { useAuth } from "../lib/auth/AuthProvider";
import { saveScore } from "../lib/scores";

type Screen =
  | "landing"
  | "login"
  | "account"
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
  account: "bottom",
  "solo-hub": "left",
  "versus-hub": "right",
  matchmaking: "center",
};

const BEST_KEY = "atlas_best_v2";
// Stashes an intent (e.g. "versus") across the login round-trip — including the
// full-page reload of Google OAuth — so we can resume it once signed in.
const PENDING_KEY = "atlas_pending";

function loadBest(): Partial<Record<GameMode, number>> {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function AtlasGame() {
  const { user, profile, isGuest, isAdmin, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>("landing");
  const [cfg, setCfg] = useState<RoundConfig>({
    mode: "find",
    play: "solo",
    region: "World" as Region,
    roundLen: 10,
  });
  const [opponent, setOpponent] = useState("Mia");
  // The resolved 1v1 match (real or bot), carried into the play screen so it can
  // sync live over realtime. Null for solo.
  const [match, setMatch] = useState<MatchInfo | null>(null);
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

  // 1v1 requires an account (real pairing needs a stable identity). Clicking 1v1
  // while signed out stashes the intent and routes to login; once signed in —
  // including after the OAuth reload — this resumes into the hub.
  useEffect(() => {
    if (user && localStorage.getItem(PENDING_KEY) === "versus") {
      localStorage.removeItem(PENDING_KEY);
      setScreen("versus-hub");
    }
  }, [user]);

  function goVersus() {
    if (user) {
      setScreen("versus-hub");
    } else {
      localStorage.setItem(PENDING_KEY, "versus");
      setScreen("login");
    }
  }

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
    // Persist the run for the leaderboard. Guests have an (anonymous) session
    // too, so their scores are saved and carry over if they later upgrade.
    // Fire-and-forget: the results screen shouldn't wait on the network.
    if (user) {
      if (r.play === "versus") {
        void saveScore(cfg, r.score, user.id, {
          won: r.score > r.oppScore,
          oppScore: r.oppScore,
        });
      } else {
        // durationMs is currently only tracked by Find the Country.
        const durationMs = (r as Partial<{ durationMs: number }>).durationMs;
        void saveScore(cfg, r.score, user.id, { durationMs });
      }
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
            onVersus={goVersus}
            onExplore={() => setScreen("learning")}
            onSignIn={() => setScreen("login")}
            onSignOut={signOut}
            onAccount={() => setScreen("account")}
            account={
              profile && !isGuest
                ? { username: profile.username, isAdmin }
                : null
            }
            onGlobeTarget={handleGlobeTarget}
          />
        )}
        {screen === "login" && (
          <LoginScreen
            onBack={() => setScreen("landing")}
            onSignedIn={() => setScreen("landing")}
          />
        )}
        {screen === "account" && (
          <AccountScreen
            onBack={() => setScreen("landing")}
            onSignedOut={() => setScreen("landing")}
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
            mode={cfg.mode}
            onCancel={() => setScreen("versus-hub")}
            onReady={(m) => {
              setOpponent(m.opponentName);
              setMatch(m);
              setScreen(cfg.mode);
            }}
          />
        )}
        {screen === "find" && (
          <FindCountryScreen
            {...playProps}
            match={cfg.play === "versus" ? match : null}
            onFinish={finish}
          />
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
