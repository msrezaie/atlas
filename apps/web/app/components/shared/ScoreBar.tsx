"use client";

import { ArrowLeft, Flame, Trophy } from "lucide-react";

interface ScoreBarProps {
  score: number;
  streak: number;
  questionNum: number;
  total: number;
  onHome: () => void;
}

export function ScoreBar({ score, streak, questionNum, total, onHome }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#020c1a]/90 backdrop-blur-md border-b border-white/8 sticky top-0 z-20">
      <button onClick={onHome}
        className="p-1.5 rounded-lg text-[#6b9ab8] hover:text-[#e8f4ff] hover:bg-white/10 transition-colors"
        aria-label="Back to home">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex-1 flex items-center gap-2.5 min-w-0">
        <span className="text-xs tabular-nums text-[#6b9ab8] whitespace-nowrap font-semibold">
          {questionNum}/{total}
        </span>
        <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(questionNum / total) * 100}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {streak >= 2 && (
          <div className="flex items-center gap-0.5 text-amber-400 animate-pulse">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-black tabular-nums">{streak}</span>
          </div>
        )}
        <div className="font-black text-xl tabular-nums text-primary min-w-[40px] text-right">
          {score}
        </div>
      </div>
    </div>
  );
}