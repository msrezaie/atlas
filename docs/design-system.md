# Design system (`@atlas/tokens`)

`@atlas/tokens` is the **single source of truth** for the design language —
colours, spacing, type scale, radii, shadows, and motion. It exists so the same
values drive the web app's CSS **and** (eventually) the React Native app, and so
a future rebrand happens in one place.

## Structure

```
packages/tokens/
├─ palette.ts     Raw colour primitives (ink ramp, teal, amber, continents…)
├─ scale.ts       Non-colour scales (space, fontSize, radius, shadow, easing…)
├─ cssvars.ts     Derives CSS var names + resolves var() chains to concrete values
├─ index.ts       Public API: raw exports + a resolved, DOM-free `tokens` object
├─ build-css.ts   Generator → writes the web's *.generated.css
└─ _resolve-ts.mjs  Node loader shim so build-css.ts runs under plain `node`
```

Entry points: `.` (everything), `./palette`, `./scale`, `./cssvars`.

## Two consumers, one source

### Web — generated CSS

`build-css.ts` emits two files into `apps/web/app/styles/` from the TS tokens:

- `tokens.generated.css` — the `:root { --… }` custom properties (raw palette,
  semantic aliases, spacing, motion).
- `theme.generated.css` — Tailwind v4's `@theme inline { … }` block (shadcn
  colour aliases + the type/radius/shadow/easing scale).

The app imports these (via `styles/index.css`), so every existing `var(--…)`
read keeps working unchanged. The hand-authored non-token bits (keyframes, helper
classes, `@layer base`) stay in `tokens.css` / `theme.css`.

> The `*.generated.css` files carry a "do not edit" banner — they're derived.
> Edit `palette.ts` / `scale.ts` and regenerate.

### React Native — resolved values

`index.ts` exports a `tokens` object with **concrete** values (var() chains
resolved to hex/rgba) and `tokens.px.{space,fontSize,radius}` numerics, since RN
can't take `rem` strings and has no CSS. No DOM dependency — RN imports it
directly:

```ts
import { tokens } from "@atlas/tokens";
tokens.color.primary; // "#00c8a8"
tokens.px.radius.full; // 9999
tokens.px.space[4]; // 16
```

## Regenerating the CSS

After editing tokens:

```sh
pnpm --filter @atlas/tokens build:css
# equivalently:
node --import ./packages/tokens/_resolve-ts.mjs packages/tokens/build-css.ts
```

(The `_resolve-ts.mjs` shim lets `node` follow the repo's extensionless imports;
Node ≥ 22 strips the TS types natively.)

## Why it's built this way

The extraction was verified to reproduce **every** prior token declaration
exactly (no value changed), so it was a safe, behaviour-preserving refactor. The
payoff:

- **Rebrand once.** A rebrand changes values in `palette.ts`/`scale.ts`, regenerates,
  and both platforms update together.
- **Mobile-ready.** When `apps/mobile` gets real screens it consumes the same
  tokens — same palette, same scale, no duplication.
