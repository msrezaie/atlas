"use client";

import type { ReactNode } from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";

export interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  /** Container positioning classes. @default bottom-right */
  className?: string;
}

/** Zoom-in / zoom-out / reset button stack shared by the country maps. */
export function MapZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  className = "absolute bottom-4 right-4 flex flex-col gap-1.5 z-10",
}: MapZoomControlsProps) {
  const buttons: { icon: ReactNode; action: () => void }[] = [
    { icon: <Plus className="w-3.5 h-3.5" />, action: onZoomIn },
    { icon: <Minus className="w-3.5 h-3.5" />, action: onZoomOut },
    { icon: <RotateCcw className="w-3 h-3" />, action: onReset },
  ];
  return (
    <div className={className}>
      {buttons.map(({ icon, action }, i) => (
        <button
          key={i}
          onClick={action}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-md"
          style={{
            background: "var(--surface-elevated)",
            border: "1px solid var(--border-strong)",
            color: "var(--fg-muted)",
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
