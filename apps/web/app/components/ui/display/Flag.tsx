"use client";

import type { CSSProperties, ImgHTMLAttributes } from "react";

export interface FlagProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "style" | "src" | "width" | "height"
> {
  iso2: string;
  name?: string;
  /** @default "md" */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  rounded?: boolean;
  style?: CSSProperties;
}

const SIZES: Record<
  NonNullable<FlagProps["size"]>,
  { w: number; h: number; r: number }
> = {
  xs: { w: 24, h: 16, r: 3 },
  sm: { w: 32, h: 21, r: 4 },
  md: { w: 44, h: 29, r: 5 },
  lg: { w: 64, h: 43, r: 7 },
  xl: { w: 96, h: 64, r: 9 },
};

/**
 * Country flag in a framed tile. Sources from flagcdn.com by ISO-3166
 * alpha-2 code (lowercase). Slightly rounded with a hairline frame so
 * white flags read on the dark surface.
 */
export function Flag({
  iso2,
  name,
  size = "md",
  rounded = true,
  style = {},
  ...rest
}: FlagProps) {
  const s = SIZES[size] ?? SIZES.md;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${String(iso2).toLowerCase()}.svg`}
      alt={name ? `Flag of ${name}` : `${iso2} flag`}
      width={s.w}
      height={s.h}
      style={{
        width: s.w,
        height: s.h,
        objectFit: "cover",
        borderRadius: rounded ? s.r : 0,
        border: "1px solid var(--border-neutral-strong)",
        boxShadow: "var(--shadow-sm)",
        display: "block",
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    />
  );
}
