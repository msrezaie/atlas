"use client";

import { useEffect, useState } from "react";
import { Globe2, Users, Gamepad2, Trophy, TrendingUp, Activity } from "lucide-react";
import { COUNTRIES } from "@atlas/data";
import { Card } from "../../components/ui/display/Card";
import { StatTile } from "../../components/ui/display/StatTile";
import { Badge } from "../../components/ui/display/Badge";
import { fetchOverviewStats, type OverviewStats } from "../data/adminQueries";

const MODE_LABEL: Record<string, string> = {
  find: "Find the Country",
  trivia: "Geo Trivia",
  flag: "Flag Guesser",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function sectionHeading(title: string, icon: React.ReactNode) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--space-5)" }}>
      <span style={{ color: "var(--primary)", display: "flex" }}>{icon}</span>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          fontWeight: "var(--weight-bold)" as unknown as number,
          color: "var(--fg)",
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

/** Admin dashboard landing — live top-line metrics, a 14-day games chart, and
 * a recent-plays feed, all derived from Supabase. */
export function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchOverviewStats()
      .then((s) => alive && setStats(s))
      .catch(() => alive && setErrored(true));
    return () => {
      alive = false;
    };
  }, []);

  const fmt = (n: number | undefined) => (n === undefined ? "—" : n.toLocaleString());
  const series = stats?.series ?? [];
  const max = Math.max(1, ...series.map((d) => d.games));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        <Card padding="lg">
          <StatTile value={COUNTRIES.length} label="Countries" icon={<Globe2 size={18} />} accent />
        </Card>
        <Card padding="lg">
          <StatTile value={fmt(stats?.totalUsers)} label="Players" icon={<Users size={18} />} />
        </Card>
        <Card padding="lg">
          <StatTile value={fmt(stats?.gamesToday)} label="Games Today" icon={<Gamepad2 size={18} />} />
        </Card>
        <Card padding="lg">
          <StatTile value={fmt(stats?.topScore)} label="Top Score" icon={<Trophy size={18} />} />
        </Card>
      </div>

      <Card padding="lg">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--primary)", display: "flex" }}>
              <TrendingUp size={18} />
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: "var(--weight-bold)" as unknown as number,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              Games Played
            </h2>
          </div>
          <Badge tone="neutral">Last 14 days</Badge>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 180 }}>
          {series.map((d, i) => {
            const isLast = i === series.length - 1;
            return (
              <div
                key={d.label + i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  height: "100%",
                }}
              >
                <div
                  title={`${d.label}: ${d.games} games`}
                  style={{
                    width: "100%",
                    height: `${Math.round((d.games / max) * 100)}%`,
                    minHeight: d.games > 0 ? 4 : 2,
                    borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                    background: isLast
                      ? "var(--primary)"
                      : "color-mix(in srgb, var(--primary) 40%, transparent)",
                    transition: "background var(--dur-base) var(--ease-out)",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {series.map((d, i) => (
            <span
              key={d.label + i}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 10,
                color: "var(--fg-subtle)",
                whiteSpace: "nowrap",
              }}
            >
              {d.label}
            </span>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        {sectionHeading("Recent Activity", <Activity size={18} />)}
        {errored ? (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-subtle)", margin: 0 }}>
            Couldn&apos;t load activity.
          </p>
        ) : !stats ? (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-subtle)", margin: 0 }}>Loading…</p>
        ) : stats.recent.length === 0 ? (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-subtle)", margin: 0 }}>
            No games played yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {stats.recent.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom:
                    i === stats.recent.length - 1 ? "none" : "1px solid var(--border-neutral)",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--fg)" }}>
                  <strong>{item.username}</strong> scored {item.score.toLocaleString()} in{" "}
                  {MODE_LABEL[item.mode] ?? item.mode}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--fg-subtle)", whiteSpace: "nowrap" }}>
                  {relativeTime(item.when)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
