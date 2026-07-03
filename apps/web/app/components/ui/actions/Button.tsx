"use client";

import { useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "style"
> {
  /** Visual style. @default "primary" */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Stretch to fill the container width. @default false */
  fullWidth?: boolean;
  /** Icon node placed before the label (e.g. a lucide-react icon). */
  leftIcon?: ReactNode;
  /** Icon node placed after the label (e.g. an arrow). */
  rightIcon?: ReactNode;
  style?: CSSProperties;
}

const SIZES = {
  sm: {
    padding: "0 14px",
    height: 36,
    fontSize: "var(--text-sm)",
    radius: "var(--radius-md)",
    gap: 7,
  },
  md: {
    padding: "0 18px",
    height: 44,
    fontSize: "var(--text-sm)",
    radius: "var(--radius-md)",
    gap: 8,
  },
  lg: {
    padding: "0 24px",
    height: 54,
    fontSize: "var(--text-base)",
    radius: "var(--radius-lg)",
    gap: 10,
  },
} as const;

/**
 * Atlas primary action button.
 * Variants: primary (teal), secondary (elevated surface), ghost (text-only), danger.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  onClick,
  type = "button",
  children,
  style = {},
  ...rest
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const s = SIZES[size] ?? SIZES.md;

  const variants: Record<
    NonNullable<ButtonProps["variant"]>,
    { base: CSSProperties; hover: CSSProperties }
  > = {
    primary: {
      base: {
        background: "var(--primary)",
        color: "var(--primary-fg)",
        border: "1px solid transparent",
        boxShadow: hover ? "var(--glow-primary-lg)" : "var(--shadow-sm)",
      },
      hover: { background: "var(--primary-hover)" },
    },
    secondary: {
      base: {
        background: "var(--surface-elevated)",
        color: "var(--fg)",
        border: "1px solid var(--border-strong)",
        boxShadow: "var(--edge-top)",
      },
      hover: { background: "var(--ink-600)" },
    },
    ghost: {
      base: {
        background: hover ? "var(--overlay-2)" : "transparent",
        color: "var(--fg-subtle)",
        border: "1px solid transparent",
      },
      hover: { color: "var(--fg)" },
    },
    danger: {
      base: {
        background: "var(--danger)",
        color: "var(--danger-fg)",
        border: "1px solid transparent",
      },
      hover: { background: "#dc2626" },
    },
  };
  const v = variants[variant] ?? variants.primary;

  const composed: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    width: fullWidth ? "100%" : "auto",
    height: s.height,
    padding: s.padding,
    fontFamily: "var(--font-body)",
    fontWeight: "var(--weight-bold)" as unknown as number,
    fontSize: s.fontSize,
    lineHeight: 1,
    borderRadius: s.radius,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transform: active && !disabled ? "scale(var(--press-scale))" : "scale(1)",
    transition:
      "transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)",
    WebkitTapHighlightColor: "transparent",
    ...v.base,
    ...(hover && !disabled ? v.hover : {}),
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={composed}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
