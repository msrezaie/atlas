"use client";

import { useState } from "react";
import type { RoundResult, Screen } from "@atlas/types";
import { RotatingGlobe } from "./shared/RotatingGlobe";
import { ResultsScreen } from "./shared/ResultsScreen";
import { Home }          from "./home/Home";
import { FindCountry }   from "./find-country/FindCountry";

// ─── App ──────────────────────────────────────────────────────────────────────

export default function AtlasGame() {
  const [screen, setScreen]           = useState<Screen>("home");
  const [lastResult, setLastResult]   = useState<RoundResult | null>(null);
  const [bestScore, setBestScore]     = useState(0);

  const handleFinish = (result: RoundResult) => {
    setBestScore((prev) => Math.max(prev, result.score));
    setLastResult(result);
    setScreen("results");
  };

  return (
    <>
      <RotatingGlobe dimmed={screen === "find-country"} />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(2,8,20,0.6) 100%)",
        }}
      />
      <div className="relative" style={{ zIndex: 10 }}>
        {screen === "home" && (
          <Home bestScore={bestScore} onPlay={() => setScreen("find-country")} />
        )}
        {screen === "find-country" && (
          <FindCountry onFinish={handleFinish} onHome={() => setScreen("home")} />
        )}
        {screen === "results" && lastResult && (
          <ResultsScreen
            result={lastResult}
            bestScore={bestScore}
            onPlayAgain={() => setScreen("find-country")}
            onHome={() => setScreen("home")}
          />
        )}
      </div>
    </>
  );
}
