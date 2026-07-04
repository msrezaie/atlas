import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Simple standalone content page for the footer links (About, Privacy, …).
 * These are placeholder marketing pages — real routes so the footer links go
 * somewhere, to be fleshed out later.
 */
export function MarketingPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--background)" }}>
      <style>{`
        .mk-prose h2 { font-family: var(--font-display); font-size: 20px; font-weight: 700;
          color: var(--fg); margin: 30px 0 10px; }
        .mk-prose p { color: var(--fg-muted); line-height: 1.7; margin: 0 0 14px; font-size: 15px; }
        .mk-prose ul { margin: 0 0 14px; padding-left: 20px; color: var(--fg-muted); line-height: 1.7; font-size: 15px; }
        .mk-prose li { margin-bottom: 6px; }
        .mk-prose strong { color: var(--fg); }
        .mk-prose a { color: var(--primary); }
      `}</style>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px 24px",
          borderBottom: "1px solid var(--border-neutral)",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark-teal.png" alt="Atlas" style={{ width: 28, height: 28 }} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: "-0.02em",
              color: "var(--fg)",
            }}
          >
            Atlas
          </span>
        </Link>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--fg-muted)",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={15} /> Back to Atlas
        </Link>
      </header>

      <main style={{ maxWidth: "var(--width-prose)", margin: "0 auto", padding: "48px 24px 96px" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "var(--fg)",
            margin: 0,
          }}
        >
          {title}
        </h1>
        {lead && (
          <p
            style={{
              fontSize: 18,
              color: "var(--fg-muted)",
              lineHeight: 1.6,
              margin: "16px 0 8px",
            }}
          >
            {lead}
          </p>
        )}
        <div className="mk-prose" style={{ marginTop: 20 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
