"use client";

import { Globe, Flag, Brain, MapPin, Lock, Trophy } from "lucide-react";

interface HomeProps {
  bestScore: number;
  onPlay: () => void;
}

const MODES = [
  { id: "find-country", icon: <Globe className="w-6 h-6" />, title: "Find the Country", desc: "Locate countries on the world map",  active: true  },
  { id: "guess-flag",   icon: <Flag  className="w-6 h-6" />, title: "Guess the Flag",   desc: "Identify countries by their flags", active: false },
  { id: "geo-trivia",   icon: <Brain className="w-6 h-6" />, title: "Geo Trivia",        desc: "Capitals, comparisons & more",      active: false },
];

export function Home({ bestScore, onPlay }: HomeProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-primary/12 border border-primary/22 mb-5 shadow-xl shadow-primary/10">
          <MapPin className="w-9 h-9 text-primary" />
        </div>
        <h1
          className="text-6xl font-black tracking-tight text-[#e8f4ff]"
          style={{ fontFamily: "'Outfit', sans-serif" }}>
          Atlas
        </h1>
        <p className="text-[#6b9ab8] mt-2.5 text-sm font-medium">
          Learn world geography — one game at a time
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <p className="text-[11px] font-bold text-[#6b9ab8] uppercase tracking-widest px-1">
          Game Modes
        </p>
        {MODES.map((mode) =>
          mode.active ? (
            <button key={mode.id} onClick={onPlay}
              className="w-full bg-gradient-to-br from-teal-500/12 to-cyan-600/6 border border-teal-500/18 rounded-2xl p-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-all group backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/14 border border-primary/18 flex items-center justify-center text-primary group-hover:bg-primary/22 transition-colors shrink-0">
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#e8f4ff]">{mode.title}</p>
                  <p className="text-xs text-[#6b9ab8] mt-0.5">{mode.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {bestScore > 0 && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <Trophy className="w-3.5 h-3.5" />
                      <span className="text-xs font-black tabular-nums">{bestScore}</span>
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Play →
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <div key={mode.id}
              className="w-full bg-white/3 border border-white/7 rounded-2xl p-5 opacity-38 cursor-not-allowed backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-[#6b9ab8] shrink-0">
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#e8f4ff]">{mode.title}</p>
                  <p className="text-xs text-[#6b9ab8] mt-0.5">{mode.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Lock className="w-3 h-3 text-[#6b9ab8]" />
                  <span className="text-[11px] font-semibold text-[#6b9ab8]">Soon</span>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}