"use client";

import type { CSSProperties } from "react";

export interface GlobeSpinnerProps {
  /** Diameter in px. @default 72 */
  size?: number;
  /** Optional caption below the globe (e.g. "Loading map…"). */
  label?: string;
  style?: CSSProperties;
}

const MERIDIAN_ANGLES = [0, 60, 120];

/**
 * Loading indicator — a wireframe globe built from real CSS 3D transforms
 * (a `preserve-3d` group of meridian rings animated with a single `rotateY`
 * keyframe) rather than canvas + rAF. It's compositor-only work, so it's
 * cheap to mount several at once (map loads, matchmaking) without a JS
 * render loop competing with everything else on the page.
 */
export function GlobeSpinner({ size = 72, label, style = {} }: GlobeSpinnerProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        ...style,
      }}
    >
      <div style={{ width: size, height: size, position: "relative", perspective: size * 3 }}>
        {/* ambient glow, matches the app's persistent-globe treatment */}
        <div
          style={{
            position: "absolute",
            inset: -size * 0.28,
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--primary) 20%, transparent), transparent 72%)",
          }}
        />
        {/* equator band — static 2D squash, no 3D ordering risk */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: size * 0.32,
            height: size * 0.36,
            borderRadius: "50%",
            border: "1.5px solid color-mix(in srgb, var(--teal-400) 50%, transparent)",
          }}
        />
        {/* meridian rings — spin together as a preserve-3d group */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            animation: "atlas-globe-spin 2.6s linear infinite",
          }}
        >
          {MERIDIAN_ANGLES.map((deg, i) => (
            <div
              key={deg}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `1.5px solid ${i === 0 ? "var(--teal-300)" : "var(--teal-500)"}`,
                transform: `rotateY(${deg}deg)`,
              }}
            />
          ))}
        </div>
      </div>
      {label && (
        <p className="atlas-eyebrow" style={{ margin: 0, color: "var(--fg-subtle)" }}>
          {label}
        </p>
      )}
    </div>
  );
}
