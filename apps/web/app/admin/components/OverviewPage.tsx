"use client";

import { Globe2, Users, Gamepad2, Target, TrendingUp, Activity } from "lucide-react";
import { COUNTRIES } from "@atlas/data";
import { Card } from "../../components/ui/display/Card";
import { StatTile } from "../../components/ui/display/StatTile";
import { Badge } from "../../components/ui/display/Badge";

interface DayStat {
  label: string;
  games: number;
}

const GAMES_SERIES: DayStat[] = [
  { label: "Jun 20", games: 780 },
  { label: "Jun 21", games: 812 },
  { label: "Jun 22", games: 690 },
  { label: "Jun 23", games: 940 },
  { label: "Jun 24", games: 1005 },
  { label: "Jun 25", games: 870 },
  { label: "Jun 26", games: 960 },
  { label: "Jun 27", games: 1120 },
  { label: "Jun 28", games: 1240 },
  { label: "Jun 29", games: 990 },
  { label: "Jun 30", games: 1080 },
  { label: "Jul 1", games: 1310 },
  { label: "Jul 2", games: 1190 },
  { label: "Jul 3", games: 1096 },
];

interface ActivityItem {
  who: string;
  action: string;
  when: string;
  tone: "primary" | "success" | "amber" | "neutral";
}

const ACTIVITY: ActivityItem[] = [
  {
    who: "Priya Natarajan",
    action: "published updated capital data for Bhutan",
    when: "2 minutes ago",
    tone: "success",
  },
  {
    who: "System",
    action: "flagged 3 duplicate player accounts for review",
    when: "18 minutes ago",
    tone: "amber",
  },
  {
    who: "Amara Okafor",
    action: "suspended a user for leaderboard abuse",
    when: "41 minutes ago",
    tone: "amber",
  },
  {
    who: "Marcus Webb",
    action: "invited 2 new moderators",
    when: "1 hour ago",
    tone: "primary",
  },
  {
    who: "System",
    action: "generated 240 new AI trivia questions",
    when: "2 hours ago",
    tone: "neutral",
  },
  {
    who: "Kenji Watanabe",
    action: "set a new best score in 1v1 Online (9,940 pts)",
    when: "3 hours ago",
    tone: "success",
  },
];

function sectionHeading(title: string, icon: React.ReactNode) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: "var(--space-5)",
      }}
    >
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

/** Admin dashboard landing page — top-line metrics, a 14-day activity
 * chart, and a recent-activity feed. */
export function OverviewPage() {
  const max = Math.max(...GAMES_SERIES.map((d) => d.games));

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
          <StatTile
            value={COUNTRIES.length}
            label="Countries"
            icon={<Globe2 size={18} />}
            accent
          />
        </Card>
        <Card padding="lg">
          <StatTile value="8,412" label="Active Users" icon={<Users size={18} />} />
        </Card>
        <Card padding="lg">
          <StatTile value="1,096" label="Games Today" icon={<Gamepad2 size={18} />} />
        </Card>
        <Card padding="lg">
          <StatTile value="76%" label="Avg. Accuracy" icon={<Target size={18} />} />
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
          {GAMES_SERIES.map((d, i) => {
            const isLast = i === GAMES_SERIES.length - 1;
            return (
              <div
                key={d.label}
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
                    minHeight: 4,
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
          {GAMES_SERIES.map((d) => (
            <span
              key={d.label}
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ACTIVITY.map((item, i) => (
            <div
              key={`${item.who}-${i}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 0",
                borderBottom:
                  i === ACTIVITY.length - 1 ? "none" : "1px solid var(--border-neutral)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  marginTop: 6,
                  flexShrink: 0,
                  background:
                    item.tone === "primary"
                      ? "var(--primary)"
                      : item.tone === "success"
                        ? "var(--success)"
                        : item.tone === "amber"
                          ? "var(--amber-400)"
                          : "var(--fg-subtle)",
                }}
              />
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--fg)", lineHeight: 1.5 }}>
                <strong style={{ fontWeight: "var(--weight-bold)" as unknown as number }}>
                  {item.who}
                </strong>{" "}
                <span style={{ color: "var(--fg-muted)" }}>{item.action}</span>
              </p>
              <span
                style={{
                  marginLeft: "auto",
                  flexShrink: 0,
                  fontSize: "var(--text-xs)",
                  color: "var(--fg-subtle)",
                  whiteSpace: "nowrap",
                }}
              >
                {item.when}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
