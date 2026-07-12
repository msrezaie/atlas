// Atlas raw palette — the primitive colour values, platform-agnostic.
// Deep-ocean dark theme: navy "ink" surfaces, teal wayfinding accent, five
// continent hues. These concrete values are the single source both the web
// (emitted as CSS custom properties) and React Native (imported directly)
// consume. Semantic aliases live in ./semantic.

/** Ink: surface ramp (deep ocean → elevated). */
export const ink = {
  950: "#020b18", // app background — deepest ocean
  900: "#061428", // card / panel
  850: "#071830", // muted fill
  800: "#0a2040", // input / secondary surface
  700: "#0d2a48", // elevated / accent surface
  600: "#16395f", // hairline-strong / divider
  500: "#24507e", // disabled stroke
} as const;

/** Foreground / text ramp (moonlight → faint). */
export const fg = {
  default: "#e8f4ff", // primary text — moonlight
  muted: "#a0c8e0", // secondary text
  subtle: "#6b9ab8", // tertiary / labels / captions
  faint: "#41617a", // disabled text
} as const;

/** Teal: signature primary (wayfinding). */
export const teal = {
  300: "#5cf2d8",
  400: "#2ee6c5",
  500: "#00c8a8", // PRIMARY
  600: "#00b497",
  700: "#008f78",
  ink: "#00100d", // text on teal
} as const;

/** Amber: achievement / streak / energy. */
export const amber = {
  300: "#fcd34d",
  400: "#fbbf24",
  500: "#f59e0b",
} as const;

/** Continent palette (cartographic accents). */
export const continent = {
  americas: "#fb923c",
  europe: "#38bdf8",
  africa: "#34d399",
  asia: "#f472b6",
  oceania: "#818cf8",
} as const;

/** Continent fills (muted surface tints of the accents). */
export const continentFill = {
  americas: "#7c4a1e",
  europe: "#1e4a7c",
  africa: "#1e6e3a",
  asia: "#6e1e3a",
  oceania: "#3a1e7c",
} as const;

/** Semantic status colours. */
export const status = {
  success: "#22c55e",
  successFg: "#052e16",
  danger: "#ef4444",
  dangerFg: "#ffffff",
  warning: "#f59e0b",
  info: "#38bdf8",
} as const;

/** Translucent tokens — borders, overlays, scrim (rgba, kept literal). */
export const alpha = {
  border: "rgba(0, 200, 168, 0.1)",
  borderStrong: "rgba(0, 200, 168, 0.22)",
  borderNeutral: "rgba(232, 244, 255, 0.08)",
  borderNeutralStrong: "rgba(232, 244, 255, 0.14)",
  overlay1: "rgba(232, 244, 255, 0.03)",
  overlay2: "rgba(232, 244, 255, 0.06)",
  overlay3: "rgba(232, 244, 255, 0.1)",
  scrim: "rgba(2, 11, 24, 0.72)",
} as const;
