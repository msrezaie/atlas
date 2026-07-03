"use client";

import { useState } from "react";
import type {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "style"> {
  as?: ElementType;
  /** @default "lg" */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  glow?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}

const PADS: Record<NonNullable<CardProps["padding"]>, string | number> = {
  none: 0,
  sm: "var(--space-3)",
  md: "var(--space-4)",
  lg: "var(--space-6)",
  xl: "var(--space-8)",
};

/**
 * Surface container — the base panel of the Atlas UI. Deep-navy fill,
 * hairline border, ambient shadow + top edge-highlight.
 */
export function Card({
  as: Tag = "div",
  padding = "lg",
  interactive = false,
  glow = false,
  onClick,
  children,
  style = {},
  ...rest
}: CardProps) {
  const [hover, setHover] = useState(false);

  return (
    <Tag
      onClick={onClick}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: "var(--surface)",
        border: `1px solid ${glow || (interactive && hover) ? "var(--border-strong)" : "var(--border)"}`,
        borderRadius: "var(--radius-2xl)",
        padding: PADS[padding] ?? PADS.lg,
        boxShadow: glow
          ? "var(--shadow-card), var(--glow-primary-lg)"
          : "var(--shadow-card)",
        transform: interactive && hover ? "translateY(-2px)" : "translateY(0)",
        transition:
          "transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
        cursor: interactive ? "pointer" : "default",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
