"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Badge, type BadgeProps } from "../../components/ui/display/Badge";
import { Button } from "../../components/ui/actions/Button";
import { DataTable, type DataTableColumn } from "../../components/ui/navigation/DataTable";
import { MOCK_USERS, type AdminUserRow, type UserRole, type UserStatus } from "../data/mockUsers";

const ROLE_TONE: Record<UserRole, BadgeProps["tone"]> = {
  Admin: "primary",
  Moderator: "amber",
  Player: "neutral",
};

const STATUS_TONE: Record<UserStatus, BadgeProps["tone"]> = {
  Active: "success",
  Suspended: "danger",
  Invited: "neutral",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

const COLUMNS: DataTableColumn<AdminUserRow>[] = [
  {
    key: "name",
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
          {initials(row.name)}
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "var(--fg)", fontWeight: "var(--weight-semibold)" as unknown as number }}>
            {row.name}
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--fg-subtle)" }}>{row.email}</span>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    render: (_value, row) => <Badge tone={ROLE_TONE[row.role]}>{row.role}</Badge>,
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
    key: "status",
    label: "Status",
    render: (_value, row) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
  },
  {
    key: "joined",
    label: "Joined",
  },
];

/** Admin table of player accounts — search, role/status badges. */
export function UsersPage() {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_USERS;
    return MOCK_USERS.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [query]);

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
        {rows.length} of {MOCK_USERS.length} users
      </span>

      <DataTable columns={COLUMNS} rows={rows} rowKey="id" />
    </div>
  );
}
