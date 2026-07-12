"use client";

export interface TimerRingProps {
  timeLeft?: number;
  total?: number;
  size?: number;
  stroke?: number;
  /** Decimal places for the centre readout (1 = show tenths). @default 0 */
  decimals?: number;
}

/**
 * Circular countdown ring. Fills teal, turns amber, then red as time
 * runs out, with the remaining seconds in the center.
 */
export function TimerRing({
  timeLeft = 0,
  total = 10,
  size = 44,
  stroke = 4,
  decimals = 0,
}: TimerRingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0;
  const color =
    frac > 0.5
      ? "var(--primary)"
      : frac > 0.25
        ? "var(--amber-400)"
        : "var(--danger)";

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--overlay-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{
            transition: `stroke-dashoffset ${decimals > 0 ? "120ms" : "1s"} linear, stroke var(--dur-base) var(--ease-out)`,
          }}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: "var(--weight-black)" as unknown as number,
          fontSize: decimals > 0 ? size * 0.3 : size * 0.36,
          color,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}
      >
        {timeLeft.toFixed(decimals)}
      </span>
    </div>
  );
}
