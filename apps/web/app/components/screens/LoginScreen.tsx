"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft, Globe } from "lucide-react";
import { Card } from "../ui/display/Card";
import { Button } from "../ui/actions/Button";
import { IconButton } from "../ui/actions/IconButton";

export interface LoginScreenProps {
  onBack: () => void;
  onSignedIn: (name: string) => void;
}

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  height: 48,
  padding: "0 14px",
  background: "var(--surface-input)",
  border: "1px solid var(--border-neutral-strong)",
  borderRadius: "var(--radius-md)",
  color: "var(--fg)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  outline: "none",
};

/** Minimal auth. Enter a name to "sign in" — mocked, no real backend. */
export function LoginScreen({ onBack, onSignedIn }: LoginScreenProps) {
  const [name, setName] = useState("");

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
            <p
              style={{ color: "var(--fg-subtle)", fontSize: 14, marginTop: 6 }}
            >
              Sign in to track progress &amp; climb the leaderboard
            </p>
          </div>

          <Card padding="lg">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  className="atlas-eyebrow"
                  style={{ display: "block", marginBottom: 7 }}
                >
                  Display name
                </label>
                <input
                  style={inputStyle}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                />
              </div>
              <div>
                <label
                  className="atlas-eyebrow"
                  style={{ display: "block", marginBottom: 7 }}
                >
                  Email
                </label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="you@example.com"
                />
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => onSignedIn(name || "Player")}
                style={{ marginTop: 4 }}
              >
                Continue
              </Button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: "2px 0",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--border-neutral)",
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--fg-faint)" }}>
                  OR
                </span>
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--border-neutral)",
                  }}
                />
              </div>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => onSignedIn("Player")}
                leftIcon={<Globe size={16} />}
              >
                Continue with Google
              </Button>
            </div>
          </Card>

          <button
            onClick={() => onSignedIn("Guest")}
            style={{
              background: "none",
              border: "none",
              color: "var(--fg-subtle)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            Skip — play as guest
          </button>
        </div>
      </div>
    </div>
  );
}
