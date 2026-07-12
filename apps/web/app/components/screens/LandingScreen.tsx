"use client";

import { useCallback, useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import {
  UserRound,
  Swords,
  Compass,
  Play,
  Globe,
  Sparkles,
  Flag as FlagIcon,
  ArrowRight,
  ChevronDown,
  MapPin,
  Users,
  Zap,
  Trophy,
  Shield,
} from "lucide-react";
import { Button } from "../ui/actions/Button";
import { resolveTarget, type Frame, type GlobeAnchor } from "../shared/TiltedGlobe";

export interface LandingScreenProps {
  onSolo: () => void;
  onVersus: () => void;
  onExplore: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  /** Open the account screen (password, sign out). */
  onAccount: () => void;
  /** The signed-in (non-guest) account, or null for guests / signed-out. */
  account: { username: string; isAdmin: boolean } | null;
  /** Hand up a driver the shared globe polls each frame to glue itself to the
   *  scroll (or null to release it). Reads scroll position live, so scrolling
   *  the heavy landing DOM never re-renders it. */
  onGlobeTarget: (fn: ((w: number, h: number) => Frame) | null) => void;
}

type NavTo = "solo" | "versus" | "explore";

interface Dest {
  id: NavTo;
  anchor: GlobeAnchor;
  accent: string;
  icon: ReactNode;
  tileTitle: string;
  tileDesc: string;
  eyebrow: string;
  heading: string;
  body: string;
  bullets: { icon: ReactNode; label: string }[];
  cta: string;
}

const DESTS: Dest[] = [
  {
    id: "solo",
    anchor: "left",
    accent: "var(--primary)",
    icon: <Play size={22} />,
    tileTitle: "Solo",
    tileDesc: "Find, Trivia & Flags — beat your best score",
    eyebrow: "Solo practice",
    heading: "Three games.\nOne you.",
    body: "Play at your own pace across three modes — locate countries on a live map, answer AI-built trivia, or match flags to names. Every run tracks your best score.",
    bullets: [
      { icon: <Globe size={16} />, label: "Find the Country" },
      { icon: <Sparkles size={16} />, label: "Geo Trivia" },
      { icon: <FlagIcon size={16} />, label: "Flag Guesser" },
    ],
    cta: "Play Solo",
  },
  {
    id: "versus",
    anchor: "right",
    accent: "var(--c-asia)",
    icon: <Swords size={22} />,
    tileTitle: "1v1 Online",
    tileDesc: "Race a live opponent, winner takes the round",
    eyebrow: "1v1 online",
    heading: "Race the\nworld, live.",
    body: "Get matched against another player and go head-to-head. Ten countries worldwide, fastest correct answer wins the round. No setup — just fast, fair rounds.",
    bullets: [
      { icon: <Users size={16} />, label: "Live matchmaking" },
      { icon: <Zap size={16} />, label: "Fastest answer wins" },
      { icon: <Globe size={16} />, label: "10 worldwide rounds" },
    ],
    cta: "Find a Match",
  },
  {
    id: "explore",
    anchor: "top",
    accent: "var(--accent)",
    icon: <Compass size={22} />,
    tileTitle: "Explore",
    tileDesc: "Browse the map, flags & facts for every country",
    eyebrow: "Explore countries",
    heading: "Every country,\nup close.",
    body: "Wander a live world map and open any country for its flag, capital, languages, famous landmarks, colonial history and more. Pure discovery, no clock.",
    bullets: [
      { icon: <MapPin size={16} />, label: "Live, zoomable map" },
      { icon: <FlagIcon size={16} />, label: "198 country profiles" },
      { icon: <Trophy size={16} />, label: "Flags, facts & history" },
    ],
    cta: "Explore Countries",
  },
];

const scrim = (css: CSSProperties): CSSProperties => ({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  ...css,
});

// ── Hero spotlight tile ───────────────────────────────────────────────────────
function HeroTile({
  accent,
  icon,
  title,
  desc,
  onClick,
}: {
  accent: string;
  icon: ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="landing-tile"
      style={{
        // Solid, not glassy — a dark card lifted with an accent-tinted top.
        background: `linear-gradient(165deg, color-mix(in srgb, ${accent} 20%, var(--ink-850)) 0%, var(--ink-900) 62%)`,
        border: `1px solid color-mix(in srgb, ${accent} 38%, transparent)`,
        borderRadius: "var(--radius-2xl)",
        padding: "22px 20px",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 14px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
        // custom prop consumed by the hover rule in the <style> block below
        ["--tile-accent" as string]: accent,
        transition:
          "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 46,
          height: 46,
          borderRadius: "var(--radius-lg)",
          background: accent,
          color: "var(--ink-950)",
          boxShadow: `0 6px 18px color-mix(in srgb, ${accent} 45%, transparent)`,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 20,
          color: "var(--fg)",
        }}
      >
        {title}
      </span>
      <span style={{ fontSize: 13.5, color: "var(--fg-muted)", lineHeight: 1.45, flex: 1 }}>
        {desc}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          color: accent,
        }}
      >
        Play <ArrowRight size={15} />
      </span>
    </button>
  );
}

// ── Section visual mockups (decorative, on-brand) ─────────────────────────────
function panel(accent: string, children: ReactNode) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        background: "var(--surface)",
        border: `1px solid color-mix(in srgb, ${accent} 24%, var(--border-neutral-strong))`,
        borderRadius: "var(--radius-2xl)",
        boxShadow: "var(--shadow-lg)",
        padding: 18,
      }}
    >
      {children}
    </div>
  );
}

function SoloVisual({ accent }: { accent: string }) {
  const rows = [
    { icon: <Globe size={18} />, label: "Find the Country", sub: "Locate it on the map" },
    { icon: <Sparkles size={18} />, label: "Geo Trivia", sub: "AI-built questions" },
    { icon: <FlagIcon size={18} />, label: "Flag Guesser", sub: "Match & type names" },
  ];
  return panel(
    accent,
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: "var(--radius-lg)",
            background: "var(--overlay-2)",
            border: "1px solid var(--border-neutral)",
          }}
        >
          <span
            style={{
              display: "flex",
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-md)",
              background: `color-mix(in srgb, ${accent} 16%, transparent)`,
              color: accent,
            }}
          >
            {r.icon}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--fg)" }}>
              {r.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{r.sub}</div>
          </div>
          <ArrowRight size={15} color="var(--fg-faint)" />
        </div>
      ))}
    </div>,
  );
}

function VersusVisual({ accent }: { accent: string }) {
  const puck = (label: string, color: string) => (
    <div
      style={{
        width: 62,
        height: 62,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `color-mix(in srgb, ${color} 22%, var(--ink-900))`,
        border: `2px solid ${color}`,
        color,
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        fontSize: 20,
      }}
    >
      {label}
    </div>
  );
  return panel(
    accent,
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {puck("YOU", "var(--primary)")}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 30,
              color: "var(--fg)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            7 : 5
          </div>
          <div className="atlas-eyebrow" style={{ color: "var(--fg-subtle)" }}>
            Round 8 / 10
          </div>
        </div>
        {puck("MIA", accent)}
      </div>
      <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--overlay-2)", overflow: "hidden" }}>
        <div style={{ width: "80%", height: "100%", background: "var(--primary)", borderRadius: 3 }} />
      </div>
    </div>,
  );
}

function ExploreVisual({ accent }: { accent: string }) {
  return panel(
    accent,
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 52,
            height: 34,
            borderRadius: 6,
            background: "linear-gradient(90deg, #0055a4 33%, #fff 33% 66%, #ef4135 66%)",
            border: "1px solid var(--border-neutral-strong)",
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--fg)" }}>
            France
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>Paris · Europe</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { k: "Population", v: "67M" },
          { k: "Languages", v: "French" },
          { k: "Currency", v: "Euro (€)" },
          { k: "Area", v: "552k km²" },
        ].map((f) => (
          <div
            key={f.k}
            style={{
              padding: "9px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--overlay-2)",
              border: "1px solid var(--border-neutral)",
            }}
          >
            <div className="atlas-eyebrow" style={{ color: "var(--fg-subtle)" }}>{f.k}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>{f.v}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--fg-muted)",
          lineHeight: 1.5,
          borderTop: "1px solid var(--border-neutral)",
          paddingTop: 10,
        }}
      >
        Landmarks, colonial history & notable facts for all 198 countries.
      </div>
    </div>,
  );
}

const VISUAL: Record<NavTo, (accent: string) => ReactNode> = {
  solo: (a) => <SoloVisual accent={a} />,
  versus: (a) => <VersusVisual accent={a} />,
  explore: (a) => <ExploreVisual accent={a} />,
};

// ── Mode section (Geoguessr-style, alternating) ───────────────────────────────
function Section({
  dest,
  reversed,
  onGo,
}: {
  dest: Dest;
  reversed: boolean;
  onGo: () => void;
}) {
  return (
    <section
      data-anchor={dest.anchor}
      style={{ position: "relative", minHeight: "100%", display: "flex", alignItems: "center" }}
    >
      {/* A soft radial pool behind the copy rather than a full-height vertical
          band. The old linear scrim spanned the whole section height, so its
          hard top/bottom edges cut a visible seam across the globe as the
          section scrolled through. This fades to transparent in every
          direction, so neighbouring sections melt into one another. */}
      <div
        style={scrim({
          background: reversed
            ? "radial-gradient(78% 82% at 74% 50%, rgba(2,11,24,0.9) 0%, rgba(2,11,24,0.5) 44%, rgba(2,11,24,0) 72%)"
            : "radial-gradient(78% 82% at 26% 50%, rgba(2,11,24,0.9) 0%, rgba(2,11,24,0.5) 44%, rgba(2,11,24,0) 72%)",
        })}
      />
      <div
        className={`landing-section ${reversed ? "landing-section-rev" : ""}`}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
          padding: "80px 40px",
          display: "flex",
          alignItems: "center",
          gap: 48,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="atlas-eyebrow" style={{ color: dest.accent, marginBottom: 14 }}>
            {dest.eyebrow}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 46,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              color: "var(--fg)",
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {dest.heading}
          </h2>
          <p
            style={{
              fontSize: 17,
              color: "var(--fg-muted)",
              lineHeight: 1.6,
              margin: "18px 0 22px",
              maxWidth: 460,
            }}
          >
            {dest.body}
          </p>
          <div className="lp-bullets" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
            {dest.bullets.map((b) => (
              <span
                key={b.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 12px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--overlay-2)",
                  border: "1px solid var(--border-neutral)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--fg)",
                }}
              >
                <span style={{ color: dest.accent, display: "flex" }}>{b.icon}</span>
                {b.label}
              </span>
            ))}
          </div>
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={17} />} onClick={onGo}>
            {dest.cta}
          </Button>
        </div>
        <div
          className="landing-visual"
          style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}
        >
          {VISUAL[dest.id](dest.accent)}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ nav }: { nav: Record<NavTo, () => void> }) {
  const col = (title: string, items: ReactNode[]) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="atlas-eyebrow" style={{ color: "var(--fg-subtle)" }}>{title}</div>
      {items}
    </div>
  );
  const linkStyle: CSSProperties = {
    color: "var(--fg-muted)",
    textDecoration: "none",
    fontSize: 14,
    background: "none",
    border: "none",
    padding: 0,
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
  };
  const btn = (label: string, onClick: () => void) => (
    <button key={label} style={linkStyle} onClick={onClick}>
      {label}
    </button>
  );
  const a = (label: string, href: string) => (
    <a key={label} href={href} style={linkStyle}>
      {label}
    </a>
  );
  return (
    <footer
      style={{
        position: "relative",
        background: "var(--ink-950)",
        borderTop: "1px solid var(--border-neutral)",
        padding: "56px 40px 32px",
      }}
    >
      <div
        className="landing-footer-grid"
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          gap: 48,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ maxWidth: 300 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark-teal.png" alt="Atlas" style={{ width: 28, height: 28 }} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: 20,
                color: "var(--fg)",
                letterSpacing: "-0.02em",
              }}
            >
              Atlas
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--fg-subtle)", lineHeight: 1.6, margin: 0 }}>
            Master world geography, the fun way — find, race and explore every country on Earth.
          </p>
        </div>
        <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
          {col("Play", [btn("Solo", nav.solo), btn("1v1 Online", nav.versus), btn("Explore", nav.explore)])}
          {col("Atlas", [a("About", "/about"), a("How to Play", "/how-to-play")])}
          {col("Legal", [a("Privacy", "/privacy"), a("Terms", "/terms")])}
        </div>
      </div>
      <div
        style={{
          maxWidth: 1120,
          margin: "36px auto 0",
          paddingTop: 20,
          borderTop: "1px solid var(--border-neutral)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 12.5,
          color: "var(--fg-faint)",
        }}
      >
        <span>© {new Date().getFullYear()} Atlas. Made for map lovers.</span>
        <span>A geography game — not a school quiz.</span>
      </div>
    </footer>
  );
}

// ── Landing ────────────────────────────────────────────────────────────────────
// The globe's frame is a continuous function of scroll position: it lerps
// between the anchor of the section above the viewport centre and the one
// below it. These are the anchors in DOM order — hero, then the three mode
// sections (solo, versus, explore) — matching the `[data-anchor]` elements.
const LANDING_ANCHORS: GlobeAnchor[] = ["bottom", "left", "right", "top"];

export function LandingScreen({
  onSolo,
  onVersus,
  onExplore,
  onSignIn,
  onSignOut,
  onAccount,
  account,
  onGlobeTarget,
}: LandingScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nav: Record<NavTo, () => void> = { solo: onSolo, versus: onVersus, explore: onExplore };

  // Scroll offset at which each section sits centred in the viewport. The globe
  // interpolates between consecutive centres, so it's exactly at a section's
  // anchor when that section is centred and glides between them in between.
  const centersRef = useRef<number[]>([]);

  const computeCenters = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const secs = Array.from(root.querySelectorAll<HTMLElement>("[data-anchor]"));
    const vh = root.clientHeight;
    centersRef.current = secs.map((s) =>
      Math.max(0, s.offsetTop + s.offsetHeight / 2 - vh / 2),
    );
  }, []);

  // The driver the globe polls each frame. It reads scrollTop live (never via
  // React state) so scrolling the heavy landing tree never triggers a render —
  // the globe just tracks the scrollbar. Stable identity (empty deps).
  const getTarget = useCallback((w: number, h: number): Frame => {
    const root = scrollRef.current;
    const c = centersRef.current;
    if (!root || c.length < 2) return resolveTarget(LANDING_ANCHORS[0]!, w, h);

    const y = root.scrollTop;
    // Find the segment [c[i], c[i+1]] the scroll sits in.
    let i = 0;
    while (i < c.length - 2 && y >= c[i + 1]!) i++;
    const c0 = c[i]!;
    const c1 = c[i + 1]!;
    let t = c1 > c0 ? (y - c0) / (c1 - c0) : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const s = t * t * (3 - 2 * t); // smoothstep — ease the hand-off

    const from = resolveTarget(LANDING_ANCHORS[i]!, w, h);
    const to = resolveTarget(LANDING_ANCHORS[i + 1]!, w, h);
    return {
      r: from.r + (to.r - from.r) * s,
      tx: from.tx + (to.tx - from.tx) * s,
      ty: from.ty + (to.ty - from.ty) * s,
    };
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    computeCenters();
    onGlobeTarget(getTarget);

    // Section offsets shift with viewport size; recompute on any resize.
    const ro = new ResizeObserver(computeCenters);
    ro.observe(root);
    return () => {
      ro.disconnect();
      onGlobeTarget(null);
    };
  }, [computeCenters, getTarget, onGlobeTarget]);

  const scrollToSections = () => {
    scrollRef.current
      ?.querySelector("[data-anchor='left']")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={scrollRef} style={{ height: "100%", overflowY: "auto", scrollBehavior: "smooth" }}>
      <style>{`
        .landing-tile:hover { transform: translateY(-4px);
          box-shadow: 0 20px 44px rgba(0,0,0,0.5), 0 0 0 1px var(--tile-accent), inset 0 1px 0 rgba(255,255,255,0.06); }
        @media (min-width: 768px) {
          .landing-section-rev { flex-direction: row-reverse; }
        }
        @media (max-width: 767px) {
          .landing-section { flex-direction: column; text-align: center; padding: 64px 22px !important; gap: 32px !important; }
          .landing-section h2 { font-size: 34px !important; }
          .landing-visual { order: -1; }
          .landing-footer-grid { flex-direction: column; }
          .landing-hero-title { font-size: 38px !important; }
          .landing-hero-tiles { grid-template-columns: 1fr !important; }
          .lp-bullets { justify-content: center; }
        }
      `}</style>

      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "16px 24px",
          background: "linear-gradient(180deg, rgba(2,11,24,0.85), rgba(2,11,24,0))",
          backdropFilter: "blur(4px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark-teal.png" alt="Atlas" style={{ width: 30, height: 30 }} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 21,
              letterSpacing: "-0.02em",
              color: "var(--fg)",
            }}
          >
            Atlas
          </span>
        </div>
        <div style={{ flex: 1 }} />
        {account ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {account.isAdmin && (
              <Link
                href="/admin"
                aria-label="Open admin dashboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 13px",
                  borderRadius: "var(--radius-full)",
                  background: "color-mix(in srgb, var(--primary) 16%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--primary) 45%, transparent)",
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <Shield size={15} />
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={onAccount}
              aria-label="Account settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                background: "var(--overlay-2)",
                border: "1px solid var(--border-neutral)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--fg)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              <UserRound size={15} style={{ color: "var(--primary)" }} />
              {account.username}
            </button>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={onSignIn} leftIcon={<UserRound size={15} />}>
            Sign in
          </Button>
        )}
      </div>

      {/* Hero */}
      <section
        data-anchor="bottom"
        style={{
          position: "relative",
          minHeight: "calc(100% - 62px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "40px 24px 64px",
        }}
      >
        <div
          style={scrim({
            background:
              "linear-gradient(180deg, rgba(2,11,24,0.7) 0%, rgba(2,11,24,0.25) 42%, rgba(2,11,24,0) 66%)",
          })}
        />
        <div style={{ position: "relative", maxWidth: 1120, margin: "0 auto", width: "100%" }}>
          <div style={{ maxWidth: 720, marginBottom: 34 }}>
            <p className="atlas-eyebrow" style={{ color: "var(--primary)", marginBottom: 12 }}>
              Learn the world
            </p>
            <h1
              className="landing-hero-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 60,
                fontWeight: 900,
                letterSpacing: "-0.035em",
                lineHeight: 0.98,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              Master world geography, the fun way.
            </h1>
            <p
              style={{
                fontSize: 18,
                color: "var(--fg-muted)",
                lineHeight: 1.6,
                margin: "20px 0 0",
                maxWidth: 540,
              }}
            >
              Find countries on a live map, race friends in 1v1, and explore every
              flag, capital and fact — three ways to see the world. Pick one to start.
            </p>
          </div>

          <div
            className="landing-hero-tiles"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              maxWidth: 860,
            }}
          >
            {DESTS.map((d) => (
              <HeroTile
                key={d.id}
                accent={d.accent}
                icon={d.icon}
                title={d.tileTitle}
                desc={d.tileDesc}
                onClick={nav[d.id]}
              />
            ))}
          </div>
        </div>

        <button
          onClick={scrollToSections}
          aria-label="Scroll down"
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "none",
            border: "none",
            color: "var(--fg-subtle)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            animation: "atlas-pulse 2s ease-in-out infinite",
          }}
        >
          <span className="atlas-eyebrow" style={{ color: "var(--fg-subtle)" }}>
            Discover
          </span>
          <ChevronDown size={18} />
        </button>
      </section>

      {/* Mode sections */}
      {DESTS.map((d, i) => (
        <Section key={d.id} dest={d} reversed={i % 2 === 1} onGo={nav[d.id]} />
      ))}

      <Footer nav={nav} />
    </div>
  );
}
