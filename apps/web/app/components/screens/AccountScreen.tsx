"use client";

import type { CSSProperties } from "react";
import { ArrowLeft, LogOut, UserRound } from "lucide-react";
import { Card } from "../ui/display/Card";
import { Button } from "../ui/actions/Button";
import { IconButton } from "../ui/actions/IconButton";
import { useAuth } from "../../lib/auth/AuthProvider";

export interface AccountScreenProps {
  onBack: () => void;
  /** Called after signing out (so the shell can return to the landing). */
  onSignedOut: () => void;
}

const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 0",
  fontSize: 14,
};

/** Signed-in account — identity + sign out. (Password/email options return once
 *  a custom email sending domain is set up.) */
export function AccountScreen({ onBack, onSignedOut }: AccountScreenProps) {
  const { user, profile, isGuest, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    onSignedOut();
  }

  return (
    <div style={{ position: "relative", height: "100%", overflow: "auto" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(2,11,24,0.9) 40%, rgba(2,11,24,0.4) 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: 460,
          margin: "0 auto",
          padding: "16px 20px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div>
          <IconButton label="Back" onClick={onBack}>
            <ArrowLeft size={18} />
          </IconButton>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: "var(--radius-full)",
              background: "color-mix(in srgb, var(--primary) 16%, transparent)",
              border: "1px solid var(--border-neutral)",
              color: "var(--primary)",
            }}
          >
            <UserRound size={26} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 24,
                fontWeight: 900,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              {profile?.username ?? "Account"}
            </h1>
            <p style={{ color: "var(--fg-subtle)", fontSize: 13, margin: "2px 0 0" }}>
              {user?.email ?? (isGuest ? "Guest account" : "")}
            </p>
          </div>
        </div>

        {isGuest ? (
          <Card padding="lg">
            <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: 0, lineHeight: 1.5 }}>
              You&apos;re playing as a guest. Sign in with Google to keep your progress across
              devices.
            </p>
          </Card>
        ) : (
          <Card padding="lg">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ ...rowStyle, borderBottom: "1px solid var(--border-neutral)" }}>
                <span style={{ color: "var(--fg-subtle)" }}>Username</span>
                <span style={{ color: "var(--fg)", fontWeight: 600 }}>{profile?.username}</span>
              </div>
              {user?.email && (
                <div style={{ ...rowStyle, borderBottom: "1px solid var(--border-neutral)" }}>
                  <span style={{ color: "var(--fg-subtle)" }}>Email</span>
                  <span style={{ color: "var(--fg)", fontWeight: 600 }}>{user.email}</span>
                </div>
              )}
              <div style={rowStyle}>
                <span style={{ color: "var(--fg-subtle)" }}>Role</span>
                <span style={{ color: "var(--fg)", fontWeight: 600, textTransform: "capitalize" }}>
                  {profile?.role ?? "player"}
                </span>
              </div>
            </div>
          </Card>
        )}

        <Button variant="secondary" fullWidth leftIcon={<LogOut size={16} />} onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
