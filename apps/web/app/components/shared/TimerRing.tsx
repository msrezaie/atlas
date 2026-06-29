"use client";

export function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const r = 26, c = 2 * Math.PI * r, pct = timeLeft / total;
  const color = pct > 0.6 ? "#00c8a8" : pct > 0.3 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
      <svg width="64" height="64" className="absolute" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.35s ease" }} />
      </svg>
      <span className="text-lg font-black tabular-nums" style={{ color }}>{timeLeft}</span>
    </div>
  );
}