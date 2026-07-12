// @atlas/tokens — the single source of truth for Atlas design tokens.
//
// Web: `tokens.generated.css` / `theme.generated.css` (produced by build-css.ts)
// emit these as CSS custom properties, so existing `var(--…)` reads keep working.
// React Native: import `tokens` (concrete, var()-resolved values) and the numeric
// helpers below, which have no CSS/DOM dependency.

import {
  ink,
  fg,
  teal,
  amber,
  continent,
  continentFill,
  status,
  alpha,
} from "./palette";
import * as scale from "./scale";
import { resolve } from "./cssvars";

export * from "./palette";
export * from "./scale";
export { rootVars, themeVars, toCssDecls, resolve } from "./cssvars";

/** rem string → px number (16px root), for React Native. "9999px"/unitless ok. */
export function remToPx(value: string): number {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return 0;
  return value.trim().endsWith("rem") ? n * 16 : n;
}

function pxMap<K extends string>(obj: Record<K, string>): Record<K, number> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, val]) => [k, remToPx(val as string)]),
  ) as Record<K, number>;
}

/** Resolved, platform-agnostic theme. Colours are concrete hex/rgba (var()
 *  chains followed), so React Native can consume them directly. */
export const tokens = {
  color: {
    // raw palette
    ink,
    fg,
    teal,
    amber,
    continent,
    continentFill,
    // semantic (resolved to concrete values)
    background: resolve("var(--background)"),
    surface: resolve("var(--surface)"),
    surfaceMuted: resolve("var(--surface-muted)"),
    surfaceInput: resolve("var(--surface-input)"),
    surfaceElevated: resolve("var(--surface-elevated)"),
    textPrimary: resolve("var(--text-primary)"),
    textSecondary: resolve("var(--text-secondary)"),
    textTertiary: resolve("var(--text-tertiary)"),
    textDisabled: resolve("var(--text-disabled)"),
    primary: resolve("var(--primary)"),
    primaryHover: resolve("var(--primary-hover)"),
    primaryActive: resolve("var(--primary-active)"),
    primaryFg: resolve("var(--primary-fg)"),
    accent: resolve("var(--accent)"),
    ring: resolve("var(--ring)"),
    switchBackground: resolve("var(--switch-background)"),
    border: alpha.border,
    borderStrong: alpha.borderStrong,
    borderNeutral: alpha.borderNeutral,
    borderNeutralStrong: alpha.borderNeutralStrong,
    overlay1: alpha.overlay1,
    overlay2: alpha.overlay2,
    overlay3: alpha.overlay3,
    scrim: alpha.scrim,
    success: status.success,
    successFg: status.successFg,
    danger: status.danger,
    dangerFg: status.dangerFg,
    warning: status.warning,
    info: status.info,
  },
  space: scale.space,
  containers: scale.containers,
  fontSize: scale.fontSize,
  tracking: scale.tracking,
  leading: scale.leading,
  radius: scale.radius,
  shadow: scale.shadow,
  elevation: scale.elevation,
  weight: scale.weight,
  duration: scale.duration,
  easing: scale.easing,
  motion: scale.motion,
  /** Numeric (px) variants for React Native, which can't take rem strings. */
  px: {
    space: pxMap(scale.space),
    fontSize: pxMap(scale.fontSize),
    radius: pxMap(scale.radius),
  },
} as const;

export type Tokens = typeof tokens;
