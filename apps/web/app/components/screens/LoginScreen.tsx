"use client";

import { useState } from "react";
import { ArrowLeft, Globe } from "lucide-react";
import { Card } from "../ui/display/Card";
import { Button } from "../ui/actions/Button";
import { IconButton } from "../ui/actions/IconButton";
import { useAuth } from "../../lib/auth/AuthProvider";

export interface LoginScreenProps {
  onBack: () => void;
  /** Called once a session exists synchronously (guest / already signed in). */
  onSignedIn: () => void;
}

/**
 * Sign-in — Google OAuth, plus anonymous guest play. Email/password paths are
 * parked until a custom sending domain is set up (email delivery needs it).
 */
export function LoginScreen({ onBack, onSignedIn }: LoginScreenProps) {
  const { user, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState<null | "google">(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setBusy("google");
    const res = await signInWithGoogle();
    // On success the browser redirects away; only reached on error.
    if (res.error) {
      setError(res.error);
      setBusy(null);
    }
  }

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
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
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "16px 20px 26px",
          maxWidth: 420,
          margin: "0 auto",
        }}
      >
        <div>
          <IconButton label="Back" onClick={onBack}>
            <ArrowLeft size={18} />
          </IconButton>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
          }}
        >
          <div style={{ textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-mark-teal.png"
              alt="Atlas"
              style={{
                width: 52,
                height: 52,
                marginBottom: 12,
                filter: "drop-shadow(0 8px 24px rgba(0,200,168,0.4))",
              }}
            />
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 900,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              Welcome back
            </h1>
            <p style={{ color: "var(--fg-subtle)", fontSize: 14, marginTop: 6 }}>
              Sign in to track progress &amp; climb the leaderboard
            </p>
          </div>

          {user ? (
            <Card padding="lg">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--fg-muted)",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  You are already signed in.
                </p>
                <Button variant="primary" size="lg" fullWidth onClick={onSignedIn}>
                  Continue
                </Button>
              </div>
            </Card>
          ) : (
            <Card padding="lg">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {error && (
                  <p style={{ fontSize: 13, color: "var(--danger, #ff6b6b)", margin: 0 }}>
                    {error}
                  </p>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={busy !== null}
                  onClick={handleGoogle}
                  leftIcon={<Globe size={17} />}
                >
                  {busy === "google" ? "Redirecting…" : "Continue with Google"}
                </Button>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--fg-subtle)",
                    margin: 0,
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}
                >
                  More sign-in options are coming soon.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
