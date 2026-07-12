"use client";

import { useOnlineCount } from "../../../lib/presence";

/** Live "N online" indicator with a pulsing dot, fed by Supabase presence. */
export function OnlinePill({ accent = "var(--primary)" }: { accent?: string }) {
  const count = useOnlineCount();
  const connected = count > 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "4px 10px",
        borderRadius: "var(--radius-full)",
        background: "var(--overlay-2)",
        border: "1px solid var(--border-neutral)",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--fg)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: connected ? accent : "var(--fg-faint)",
          boxShadow: connected
            ? `0 0 0 3px color-mix(in srgb, ${accent} 22%, transparent)`
            : "none",
          animation: connected ? "atlas-pulse 1.6s ease-in-out infinite" : "none",
        }}
      />
      {connected ? (
        <>
          {count.toLocaleString()}{" "}
          <span style={{ color: "var(--fg-subtle)", fontWeight: 600 }}>online</span>
        </>
      ) : (
        <span style={{ color: "var(--fg-subtle)", fontWeight: 600 }}>Connecting…</span>
      )}
    </span>
  );
}
