"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  duration = 8,
  delay = 0,
  colorFrom = "#3b82f6",
  colorTo = "#8b5cf6",
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--duration": `${duration}s`,
          "--delay": `${delay}s`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--border-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:var(--border-width)_solid_transparent]",
        // beam
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "[background:linear-gradient(var(--color-from),var(--color-to))_border-box]",
        "after:absolute after:inset-[-1px] after:rounded-[inherit]",
        className
      )}
    >
      <span
        className="absolute inset-[-1px] rounded-[inherit] animate-border-beam"
        style={{
          background: `conic-gradient(from var(--border-beam-start, 0deg), transparent 0deg, var(--color-from) 30deg, var(--color-to) 60deg, transparent 90deg)`,
          animationDuration: `var(--duration)`,
          animationDelay: `var(--delay)`,
        }}
      />
    </div>
  );
}
