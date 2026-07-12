// Atlas non-colour scales — spacing, type, radius, shadow, motion, weights.
// Platform-agnostic values: the web emits them as CSS vars / Tailwind theme,
// React Native reads them straight off these objects.

/** Spacing scale (4px grid). rem on web; see numericSpace for RN px. */
export const space = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

/** Container widths. */
export const containers = {
  prose: "42rem",
  app: "30rem",
  content: "64rem",
} as const;

/** Type scale (rem, 16px root). */
export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.375rem",
  "2xl": "1.75rem",
  "3xl": "2.25rem",
  "4xl": "3rem",
  "5xl": "4rem",
} as const;

/** Letter spacing. */
export const tracking = {
  tighter: "-0.03em",
  tight: "-0.015em",
  normal: "0em",
  wide: "0.04em",
  widest: "0.16em",
} as const;

/** Line height. */
export const leading = {
  none: "1",
  tight: "1.15",
  snug: "1.3",
  normal: "1.5",
  relaxed: "1.65",
} as const;

/** Corner radius — 12px default tile, pills for chips. */
export const radius = {
  sm: "0.5rem",
  md: "0.625rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

/** Ambient drop shadows (CSS box-shadow strings). */
export const shadow = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
  md: "0 4px 12px rgba(0, 0, 0, 0.45)",
  lg: "0 12px 32px rgba(0, 0, 0, 0.5)",
  xl: "0 24px 64px rgba(0, 0, 0, 0.6)",
} as const;

/** Composite elevation / glow effects (CSS box-shadow strings). */
export const elevation = {
  edgeTop: "inset 0 1px 0 rgba(232, 244, 255, 0.06)",
  card: "0 8px 28px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(232, 244, 255, 0.05)",
  glowPrimary: "0 0 0 3px rgba(0, 200, 168, 0.25)",
  glowPrimaryLg: "0 8px 24px rgba(0, 200, 168, 0.28)",
  glowFocus: "0 0 0 3px rgba(0, 200, 168, 0.35)",
  glowAmber: "0 0 0 3px rgba(251, 191, 36, 0.22)",
} as const;

/** Font weights. */
export const weight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/** Motion durations. */
export const duration = {
  fast: "120ms",
  base: "200ms",
  slow: "400ms",
  slower: "700ms",
} as const;

/** Easing curves. */
export const easing = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

/** Interaction transforms (unitless scalars). */
export const motion = {
  pressScale: 0.97,
  hoverLift: 1.02,
} as const;
