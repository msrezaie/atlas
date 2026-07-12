"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Badge, type BadgeProps } from "../../components/ui/display/Badge";
import { Button } from "../../components/ui/actions/Button";
import { DataTable, type DataTableColumn } from "../../components/ui/navigation/DataTable";
import { fetchAdminUsers, type AdminUserRow } from "../data/adminQueries";

const ROLE_TONE: Record<AdminUserRow["role"], BadgeProps["tone"]> = {
  admin: "primary",
  player: "neutral",
};
const ROLE_LABEL: Record<AdminUserRow["role"], string> = {
  admin: "Admin",
  player: "Player",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (`${first}${last}` || name.slice(0, 2)).toUpperCase();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const COLUMNS: DataTableColumn<AdminUserRow>[] = [
  {
    key: "username",
    label: "User",
    render: (_value, row) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: "50%",
            background: "color-mix(in srgb, var(--primary) 16%, transparent)",
            border: "1px solid var(--border-strong)",
            color: "var(--primary)",
            fontSize: 12,
            fontWeight: "var(--weight-bold)" as unknown as number,
          }}
        >
          {initials(row.username)}
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "var(--fg)", fontWeight: "var(--weight-semibold)" as unknown as number }}>
            {row.username}
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--fg-subtle)" }}>
            {row.country ? row.country.toUpperCase() : "—"}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    render: (_value, row) => <Badge tone={ROLE_TONE[row.role]}>{ROLE_LABEL[row.role]}</Badge>,
  },
  {
    key: "isGuest",
    label: "Type",
    render: (_value, row) => (
      <Badge tone={row.isGuest ? "amber" : "success"}>{row.isGuest ? "Guest" : "Member"}</Badge>
    ),
  },
  {
    key: "games",
    label: "Games",
    align: "right",
    numeric: true,
    render: (_value, row) => row.games.toLocaleString(),
  },
  {
    key: "best",
    label: "Best Score",
    align: "right",
    numeric: true,
    render: (_value, row) => row.best.toLocaleString(),
  },
  {
    key: "joined",
    label: "Joined",
    render: (_value, row) => fmtDate(row.joined),
  },
];

/** Admin table of player accounts — live from Supabase, with search. */
export function UsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    fetchAdminUsers()
      .then((rows) => {
        if (alive) {
          setUsers(rows);
          setState("ready");
        }
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.username.toLowerCase().includes(q) || (u.country ?? "").toLowerCase().includes(q),
    );
  }, [query, users]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 360 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-subtle)",
              display: "flex",
              pointerEvents: "none",
            }}
          >
            <Search size={16} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users…"
            style={{
              width: "100%",
              height: 40,
              boxSizing: "border-box",
              padding: "0 12px 0 36px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-neutral)",
              background: "var(--surface-input)",
              color: "var(--fg)",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-body)",
              outline: "none",
            }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="sm" leftIcon={<UserPlus size={15} />} onClick={() => {}}>
          Invite User
        </Button>
      </div>

      <span style={{ fontSize: "var(--text-sm)", color: "var(--fg-muted)" }}>
        {state === "loading"
          ? "Loading users…"
          : state === "error"
            ? "Couldn't load users."
            : `${rows.length} of ${users.length} users`}
      </span>

      {state !== "error" && <DataTable columns={COLUMNS} rows={rows} rowKey="id" />}
    </div>
  );
}
