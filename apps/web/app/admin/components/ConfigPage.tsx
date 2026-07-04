"use client";

import { useState } from "react";
import { Globe, Sparkles, BookOpen, Swords, Bot, Award, Save } from "lucide-react";
import { Card } from "../../components/ui/display/Card";
import { RangeSlider } from "../../components/ui/forms/RangeSlider";
import { Toggle } from "../../components/ui/forms/Toggle";
import { Button } from "../../components/ui/actions/Button";

interface ModeMeta {
  id: "find" | "trivia" | "learning";
  title: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  default: number;
}

const MODE_TIMERS: ModeMeta[] = [
  { id: "find", title: "Find the Country", icon: <Globe size={16} />, min: 5, max: 30, default: 12 },
  { id: "trivia", title: "Geo Trivia", icon: <Sparkles size={16} />, min: 5, max: 20, default: 10 },
  { id: "learning", title: "Learning Mode", icon: <BookOpen size={16} />, min: 30, max: 300, default: 120 },
];

interface FeatureFlag {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const FEATURE_FLAGS: FeatureFlag[] = [
  { id: "find", label: "Find the Country", icon: <Globe size={16} />, description: "Locate-on-the-map mode" },
  { id: "trivia", label: "Geo Trivia", icon: <Sparkles size={16} />, description: "AI-generated question mode" },
  { id: "learning", label: "Learning Mode", icon: <BookOpen size={16} />, description: "Explore country facts" },
  { id: "versus", label: "1v1 Multiplayer", icon: <Swords size={16} />, description: "Live head-to-head matches" },
  { id: "aiEngine", label: "AI Question Engine", icon: <Bot size={16} />, description: "Dynamic trivia generation" },
  { id: "leaderboards", label: "Leaderboards", icon: <Award size={16} />, description: "Global & friend rankings" },
];

function sectionHeading(title: string, subtitle: string) {
  return (
    <div style={{ marginBottom: "var(--space-5)" }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          fontWeight: "var(--weight-bold)" as unknown as number,
          color: "var(--fg)",
          margin: "0 0 4px",
        }}
      >
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--fg-subtle)" }}>{subtitle}</p>
    </div>
  );
}

/** Admin configuration screen — round timers, scoring, and feature flags.
 * Everything here is local `useState`; "Save changes" is a no-op. */
export function ConfigPage() {
  const [timers, setTimers] = useState<Record<ModeMeta["id"], number>>(() =>
    Object.fromEntries(MODE_TIMERS.map((m) => [m.id, m.default])) as Record<ModeMeta["id"], number>,
  );
  const [points, setPoints] = useState(10);
  const [flags, setFlags] = useState<Record<string, boolean>>({
    find: true,
    trivia: true,
    learning: true,
    versus: true,
    aiEngine: true,
    leaderboards: true,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <Card padding="lg">
        {sectionHeading("Round Timers", "Time allotted per round, per game mode (seconds).")}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {MODE_TIMERS.map((m) => (
            <div key={m.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ color: "var(--primary)", display: "flex" }}>{m.icon}</span>
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-semibold)" as unknown as number,
                    color: "var(--fg)",
                  }}
                >
                  {m.title}
                </span>
              </div>
              <RangeSlider
                min={m.min}
                max={m.max}
                value={timers[m.id]}
                onChange={(v) => setTimers((prev) => ({ ...prev, [m.id]: v }))}
                minLabel={`${m.min}s`}
                maxLabel={`${m.max}s`}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        {sectionHeading("Scoring", "Base points awarded for a correct answer.")}
        <RangeSlider
          label="Points per correct answer"
          min={1}
          max={20}
          value={points}
          onChange={setPoints}
          minLabel="1"
          maxLabel="20"
        />
      </Card>

      <Card padding="lg">
        {sectionHeading("Feature Flags", "Enable or disable modes and platform features.")}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          {FEATURE_FLAGS.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                borderRadius: "var(--radius-lg)",
                background: "var(--overlay-2)",
                border: "1px solid var(--border-neutral)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: "var(--radius-md)",
                    background: "color-mix(in srgb, var(--primary) 14%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  {f.icon}
                </span>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--weight-semibold)" as unknown as number,
                      color: "var(--fg)",
                    }}
                  >
                    {f.label}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--fg-subtle)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.description}
                  </span>
                </div>
              </div>
              <Toggle
                checked={flags[f.id] ?? false}
                onChange={(checked) => setFlags((prev) => ({ ...prev, [f.id]: checked }))}
              />
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" size="md" leftIcon={<Save size={16} />} onClick={() => {}}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
