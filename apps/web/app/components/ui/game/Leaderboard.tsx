"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Card } from "../display/Card";
import { useAuth } from "../../../lib/auth/AuthProvider";
import {
  fetchLeaderboard,
  type FilterCol,
  type LeaderMetric,
  type LeaderboardRow,
} from "../../../lib/leaderboard";

export interface LeaderboardMetricOption {
  key: LeaderMetric;
  filterCol: FilterCol;
  /** Short label for the toggle chip. */
  label: string;
  /** Lower is better (e.g. fastest time). @default false */
  ascending?: boolean;
  /** Big value for a row. */
  value: (row: LeaderboardRow) => string;
  /** Small unit after the value. */
  unit: string;
}

export interface LeaderboardProps {
  title: string;
  /** One or more rankings; a toggle appears when there's more than one. */
  options: LeaderboardMetricOption[];
  accent?: string;
  limit?: number;
}

const RANK_COLOR = ["#f5c451", "#c7d0d6", "#cd8b5b"]; // gold / silver / bronze

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (`${a}${b}` || name.slice(0, 2)).toUpperCase();
}

/** Ranked player list for the Solo / 1v1 hubs. Optional metric toggle; the
 *  current user's row is highlighted. */
export function Leaderboard({
  title,
  options,
  accent = "var(--primary)",
  limit = 8,
}: LeaderboardProps) {
  const { user } = useAuth();
  const [active, setActive] = useState(0);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const opt = options[active] ?? options[0]!;

  useEffect(() => {
    let alive = true;
    setState("loading");
    fetchLeaderboard(opt.key, opt.filterCol, {
      ascending: opt.ascending,
      limit,
    })
      .then((r) => {
        if (alive) {
          setRows(r);
          setState("ready");
        }
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [opt.key, opt.filterCol, opt.ascending, limit]);

  return (
    <Card padding="md">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <Trophy size={16} style={{ color: accent }} />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 14,
            color: "var(--fg)",
          }}
        >
          {title}
        </span>
        {options.length > 1 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {options.map((o, i) => {
              const on = i === active;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setActive(i)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "var(--radius-full)",
                    border: `1px solid ${on ? `color-mix(in srgb, ${accent} 45%, transparent)` : "var(--border-neutral)"}`,
                    background: on
                      ? `color-mix(in srgb, ${accent} 16%, transparent)`
                      : "transparent",
                    color: on ? accent : "var(--fg-subtle)",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {state === "loading" ? (
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "4px 0" }}>Loading…</p>
      ) : state === "error" ? (
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "4px 0" }}>
          Couldn&apos;t load the leaderboard.
        </p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "4px 0", lineHeight: 1.5 }}>
          No scores yet — play a game to get on the board.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {rows.map((row, i) => {
            const you = user?.id === row.user_id;
            return (
              <div
                key={row.user_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 10px",
                  borderRadius: "var(--radius-md)",
                  background: you
                    ? `color-mix(in srgb, ${accent} 14%, transparent)`
                    : "transparent",
                  border: you
                    ? `1px solid color-mix(in srgb, ${accent} 40%, transparent)`
                    : "1px solid transparent",
                }}
              >
                <span
                  style={{
                    width: 20,
                    textAlign: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: 13,
                    color: RANK_COLOR[i] ?? "var(--fg-subtle)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                    color: accent,
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {initials(row.username)}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13.5,
                    fontWeight: you ? 800 : 600,
                    color: "var(--fg)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.username}
                  {you && <span style={{ color: accent, fontWeight: 700 }}> · You</span>}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 14,
                    color: "var(--fg)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {opt.value(row)}
                  <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 600 }}>
                    {" "}
                    {opt.unit}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
