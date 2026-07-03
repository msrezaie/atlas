"use client";

import { useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "style"
> {
  /** @default "ghost" */
  variant?: "ghost" | "solid" | "primary";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Accessible label — also used as the native title tooltip. */
  label?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

const SIZES = { sm: 32, md: 38, lg: 44 } as const;

/** Square icon-only button — back arrows, toolbar controls, dismiss. */
export function IconButton({
  variant = "ghost",
  size = "md",
  disabled = false,
  label,
  onClick,
  children,
  style = {},
  ...rest
}: IconButtonProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const dim = SIZES[size] ?? SIZES.md;

  const variants: Record<
    NonNullable<IconButtonProps["variant"]>,
    { base: CSSProperties }
  > = {
    ghost: {
      base: {
        background: hover ? "var(--overlay-3)" : "transparent",
        color: hover ? "var(--fg)" : "var(--fg-subtle)",
        border: "1px solid transparent",
      },
    },
    solid: {
      base: {
        background: hover ? "var(--ink-600)" : "var(--surface-elevated)",
        color: "var(--fg)",
        border: "1px solid var(--border-strong)",
      },
    },
    primary: {
      base: {
        background: hover ? "var(--primary-hover)" : "var(--primary)",
        color: "var(--primary-fg)",
        border: "1px solid transparent",
      },
    },
  };
  const v = variants[variant] ?? variants.ghost;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        borderRadius: "var(--radius-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transform:
          active && !disabled ? "scale(var(--press-scale))" : "scale(1)",
        transition:
          "transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
        ...v.base,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
