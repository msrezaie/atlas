"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LayoutDashboard, Globe2, Users, Settings, Bell, Search, ArrowLeft } from "lucide-react";
import { COUNTRIES } from "@atlas/data";
import { SideNav, type SideNavItem } from "../components/ui/navigation/SideNav";
import { IconButton } from "../components/ui/actions/IconButton";

interface PageMeta {
  title: string;
  subtitle: string;
}

const DEFAULT_META: PageMeta = {
  title: "Overview",
  subtitle: "Top-line metrics and recent activity across Atlas.",
};

const PAGE_META: Record<string, PageMeta> = {
  "/admin": DEFAULT_META,
  "/admin/countries": {
    title: "Countries",
    subtitle: "Manage the country catalog powering every game mode.",
  },
  "/admin/users": {
    title: "Users",
    subtitle: "Manage player and admin accounts.",
  },
  "/admin/config": {
    title: "Configuration",
    subtitle: "Round timers, scoring, and feature flags.",
  },
};

/** Persistent shell for /admin/** — a SideNav rail on the left, a topbar
 * with page title + search + notifications, and a scrollable content area. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: SideNavItem[] = [
    { id: "/admin", label: "Overview", icon: <LayoutDashboard size={18} /> },
    {
      id: "/admin/countries",
      label: "Countries",
      icon: <Globe2 size={18} />,
      badge: COUNTRIES.length,
    },
    { id: "/admin/users", label: "Users", icon: <Users size={18} /> },
    { id: "/admin/config", label: "Configuration", icon: <Settings size={18} /> },
  ];

  const meta = PAGE_META[pathname] ?? DEFAULT_META;

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        overflow: "hidden",
        background: "var(--background)",
      }}
    >
      <SideNav
        items={navItems}
        active={pathname}
        onSelect={(id) => router.push(id)}
        logoSrc="/brand/logo-mark-teal.png"
        footer={
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px var(--space-3)",
              borderRadius: "var(--radius-md)",
              color: "var(--fg-muted)",
              textDecoration: "none",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)" as unknown as number,
            }}
          >
            <ArrowLeft size={18} />
            Back to Atlas
          </Link>
        }
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            padding: "0 var(--space-6)",
            height: 76,
            borderBottom: "1px solid var(--border-neutral)",
            background: "var(--surface)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
                fontWeight: "var(--weight-bold)" as unknown as number,
                color: "var(--fg)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {meta.title}
            </h1>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "var(--text-sm)",
                color: "var(--fg-subtle)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meta.subtitle}
            </p>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ position: "relative", width: 260 }}>
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
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search…"
              style={{
                width: "100%",
                height: 38,
                boxSizing: "border-box",
                padding: "0 12px 0 34px",
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

          <IconButton label="Notifications" variant="ghost" onClick={() => {}}>
            <Bell size={18} />
          </IconButton>
        </header>

        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "var(--space-6)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
