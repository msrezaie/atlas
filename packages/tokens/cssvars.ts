// Bridges the typed token objects to CSS custom properties.
//
//  - `rootVars`  → the plain `:root { … }` block (raw palette + semantic
//                  aliases + spacing / motion / elevation). Emitted to
//                  tokens.generated.css.
//  - `themeVars` → Tailwind's `@theme inline { … }` block (shadcn colour
//                  aliases + the type / radius / shadow / easing scale).
//                  Emitted to theme.generated.css.
//
// Both are derived here from ./palette and ./scale, so the values exist in
// exactly one place. `resolve` follows `var(--x)` chains to a concrete value,
// which is how the React Native theme (see ./index) gets real hex/rgba.

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
import {
  space,
  containers,
  fontSize,
  tracking,
  leading,
  radius,
  shadow,
  elevation,
  weight,
  duration,
  easing,
  motion,
} from "./scale";

export type VarEntry = [name: string, value: string];

const v = (name: string) => `var(${name})`;

/** Raw palette + literal tokens → CSS var name/value pairs. */
const rawVars: VarEntry[] = [
  ...Object.entries(ink).map(([k, val]): VarEntry => [`--ink-${k}`, val]),
  ["--fg", fg.default],
  ["--fg-muted", fg.muted],
  ["--fg-subtle", fg.subtle],
  ["--fg-faint", fg.faint],
  ["--teal-300", teal[300]],
  ["--teal-400", teal[400]],
  ["--teal-500", teal[500]],
  ["--teal-600", teal[600]],
  ["--teal-700", teal[700]],
  ["--teal-ink", teal.ink],
  ...Object.entries(amber).map(([k, val]): VarEntry => [`--amber-${k}`, val]),
  ...Object.entries(continent).map(
    ([k, val]): VarEntry => [`--c-${k}`, val],
  ),
  ...Object.entries(continentFill).map(
    ([k, val]): VarEntry => [`--c-${k}-fill`, val],
  ),
  ["--success", status.success],
  ["--success-fg", status.successFg],
  ["--danger", status.danger],
  ["--danger-fg", status.dangerFg],
  ["--warning", status.warning],
  ["--info", status.info],
  ["--border", alpha.border],
  ["--border-strong", alpha.borderStrong],
  ["--border-neutral", alpha.borderNeutral],
  ["--border-neutral-strong", alpha.borderNeutralStrong],
  ["--overlay-1", alpha.overlay1],
  ["--overlay-2", alpha.overlay2],
  ["--overlay-3", alpha.overlay3],
  ["--scrim", alpha.scrim],
];

/** Semantic aliases — reference a raw var, so a rebrand of the raw value
 *  flows through. Keyed semantic var → raw var it points at. */
const semanticAliases: Record<string, string> = {
  "--background": "--ink-950",
  "--surface": "--ink-900",
  "--surface-muted": "--ink-850",
  "--surface-input": "--ink-800",
  "--surface-elevated": "--ink-700",
  "--text-primary": "--fg",
  "--text-secondary": "--fg-muted",
  "--text-tertiary": "--fg-subtle",
  "--text-disabled": "--fg-faint",
  "--primary": "--teal-500",
  "--primary-hover": "--teal-400",
  "--primary-active": "--teal-600",
  "--primary-fg": "--teal-ink",
  "--accent": "--amber-400",
  "--ring": "--teal-500",
  "--switch-background": "--ink-700",
};

const scaleRootVars: VarEntry[] = [
  ...Object.entries(weight).map(
    ([k, val]): VarEntry => [`--weight-${k}`, String(val)],
  ),
  ...Object.entries(space).map(([k, val]): VarEntry => [`--space-${k}`, val]),
  ["--width-prose", containers.prose],
  ["--width-app", containers.app],
  ["--width-content", containers.content],
  ["--edge-top", elevation.edgeTop],
  ["--shadow-card", elevation.card],
  ["--glow-primary", elevation.glowPrimary],
  ["--glow-primary-lg", elevation.glowPrimaryLg],
  ["--glow-focus", elevation.glowFocus],
  ["--glow-amber", elevation.glowAmber],
  ...Object.entries(duration).map(
    ([k, val]): VarEntry => [`--dur-${k}`, val],
  ),
  ["--ease-spring", easing.spring],
  ["--press-scale", String(motion.pressScale)],
  ["--hover-lift", String(motion.hoverLift)],
];

/** Everything in the plain `:root` block. */
export const rootVars: VarEntry[] = [
  ...rawVars,
  ...Object.entries(semanticAliases).map(
    ([name, ref]): VarEntry => [name, v(ref)],
  ),
  ...scaleRootVars,
];

/** shadcn-style colour aliases for Tailwind's `@theme inline`. */
const themeColorVars: VarEntry[] = [
  ["--color-background", v("--background")],
  ["--color-foreground", v("--fg")],
  ["--color-card", v("--surface")],
  ["--color-card-foreground", v("--fg")],
  ["--color-popover", v("--surface")],
  ["--color-popover-foreground", v("--fg")],
  ["--color-primary", v("--primary")],
  ["--color-primary-foreground", v("--primary-fg")],
  ["--color-secondary", v("--surface-input")],
  ["--color-secondary-foreground", v("--fg-muted")],
  ["--color-muted", v("--surface-muted")],
  ["--color-muted-foreground", v("--fg-subtle")],
  ["--color-accent", v("--surface-elevated")],
  ["--color-accent-foreground", v("--fg")],
  ["--color-destructive", v("--danger")],
  ["--color-destructive-foreground", v("--danger-fg")],
  ["--color-border", v("--border")],
  ["--color-input", v("--surface-input")],
  ["--color-input-background", v("--surface-input")],
  ["--color-switch-background", v("--switch-background")],
  ["--color-ring", v("--ring")],
  ["--color-sidebar", v("--surface")],
  ["--color-sidebar-foreground", v("--fg")],
  ["--color-sidebar-primary", v("--primary")],
  ["--color-sidebar-primary-foreground", v("--primary-fg")],
  ["--color-sidebar-accent", v("--surface-elevated")],
  ["--color-sidebar-accent-foreground", v("--fg")],
  ["--color-sidebar-border", v("--border")],
  ["--color-sidebar-ring", v("--ring")],
];

const scaleThemeVars: VarEntry[] = [
  ...Object.entries(fontSize).map(
    ([k, val]): VarEntry => [`--text-${k}`, val],
  ),
  ...Object.entries(tracking).map(
    ([k, val]): VarEntry => [`--tracking-${k}`, val],
  ),
  ...Object.entries(leading).map(
    ([k, val]): VarEntry => [`--leading-${k}`, val],
  ),
  ...Object.entries(radius).map(([k, val]): VarEntry => [`--radius-${k}`, val]),
  ...Object.entries(shadow).map(([k, val]): VarEntry => [`--shadow-${k}`, val]),
  ["--ease-out", easing.out],
  ["--ease-in-out", easing.inOut],
];

/** Everything in Tailwind's `@theme inline` block. */
export const themeVars: VarEntry[] = [...themeColorVars, ...scaleThemeVars];

// ---- resolution (for React Native) --------------------------------------

const lookup = new Map<string, string>([...rootVars, ...themeVars]);

/** Resolve a value to a concrete one, following `var(--x)` references. */
export function resolve(value: string): string {
  let out = value;
  // Chains are shallow (color → semantic → raw), but loop to be safe.
  for (let i = 0; i < 8 && out.startsWith("var("); i++) {
    const name = out.slice(4, -1).trim();
    const next = lookup.get(name);
    if (next === undefined) break;
    out = next;
  }
  return out;
}

/** Serialise entries to CSS declarations at the given indent. */
export function toCssDecls(entries: VarEntry[], indent = "  "): string {
  return entries.map(([name, value]) => `${indent}${name}: ${value};`).join("\n");
}
