"use client";

import { Trophy } from "lucide-react";
import type { RoundResult } from "@atlas/types";

interface ResultsScreenProps {
  result: RoundResult;
  bestScore: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function ResultsScreen({ result, bestScore, onPlayAgain, onHome }: ResultsScreenProps) {
  const acc      = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const isNewBest = result.score > 0 && result.score >= bestScore;
  const emoji    = acc >= 90 ? "🏆" : acc >= 70 ? "⭐" : "🌍";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#061428]/92 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-3xl font-black text-[#e8f4ff]">Round Complete!</h2>
          {isNewBest && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 bg-amber-400/12 text-amber-300 border border-amber-500/22 px-3 py-1 rounded-full text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" /> New Best Score!
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-7">
          {([
            ["Score",       result.score],
            ["Best Streak", result.longestStreak],
            ["Accuracy",    `${acc}%`],
          ] as const).map(([l, v]) => (
            <div key={l} className="bg-white/5 rounded-2xl p-4 text-center border border-white/8">
              <div className="text-2xl font-black text-[#e8f4ff]">{v}</div>
              <div className="text-[11px] text-[#6b9ab8] mt-1 font-semibold uppercase tracking-wide">{l}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onPlayAgain}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all">
            Play Again
          </button>
          <button onClick={onHome}
            className="w-full py-2.5 text-[#6b9ab8] hover:text-[#e8f4ff] font-semibold transition-colors text-sm">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}