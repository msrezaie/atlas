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
  /** Applied to the outer frame (the atomic flag element). */
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
 * Country flag in a fixed-size "chip" frame. The flag is drawn at its *natural*
 * aspect ratio (`object-fit: contain`), so irregular flags display correctly
 * rather than being cropped or stretched — Nepal's non-rectangular pennant, and
 * the square Swiss and Vatican flags, all show in full. The frame keeps a
 * consistent footprint for layout; its subtle matting fills whatever letterbox
 * space a non-3:2 flag leaves, so the set reads as one uniform system.
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
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: s.w,
        height: s.h,
        flexShrink: 0,
        boxSizing: "border-box",
        borderRadius: rounded ? s.r : 0,
        border: "1px solid var(--border-neutral-strong)",
        background: "var(--overlay-2)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://flagcdn.com/${String(iso2).toLowerCase()}.svg`}
        alt={name ? `Flag of ${name}` : `${iso2} flag`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
        {...rest}
      />
    </span>
  );
}
