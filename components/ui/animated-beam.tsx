"use client";

import React, { forwardRef, useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement | null>;
  fromRef: React.RefObject<HTMLElement | null>;
  toRef: React.RefObject<HTMLElement | null>;
  curvature?: number;
  duration?: number;
  delay?: number;
  reverse?: boolean;
  colorFrom?: string;
  colorTo?: string;
  pathWidth?: number;
  dotSize?: number;
}

export const AnimatedBeam = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  duration = 3,
  delay = 0,
  reverse = false,
  colorFrom = "#3b82f6",
  colorTo = "#8b5cf6",
  pathWidth = 1.5,
  dotSize = 4,
}: AnimatedBeamProps) => {
  const id = React.useId();
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const fromRect = fromRef.current.getBoundingClientRect();
      const toRect = toRef.current.getBoundingClientRect();

      const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
      const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
      const toX = toRect.left - containerRect.left + toRect.width / 2;
      const toY = toRect.top - containerRect.top + toRect.height / 2;

      setSvgDimensions({
        width: containerRect.width,
        height: containerRect.height,
      });

      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2 - curvature;
      setPathD(`M ${fromX},${fromY} Q ${midX},${midY} ${toX},${toY}`);
    };

    updatePath();
    const observer = new ResizeObserver(updatePath);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, fromRef, toRef, curvature]);

  if (!pathD) return null;

  const gradientId = `beam-gradient-${id}`;
  const dotId = `beam-dot-${id}`;

  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
      width={svgDimensions.width}
      height={svgDimensions.height}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colorFrom} stopOpacity="0" />
          <stop offset="30%" stopColor={colorFrom} stopOpacity="0.8" />
          <stop offset="70%" stopColor={colorTo} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colorTo} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Base path (faint) */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={pathWidth}
      />

      {/* Animated traveling dot */}
      <circle r={dotSize} fill={`url(#${gradientId})`} opacity="0">
        <animateMotion
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          keyPoints={reverse ? "1;0" : "0;1"}
          keyTimes="0;1"
          calcMode="linear"
        >
          <mpath href={`#path-${id}`} />
        </animateMotion>
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          keyTimes="0;0.1;0.9;1"
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </circle>

      {/* Named path for mpath reference */}
      <path id={`path-${id}`} d={pathD} fill="none" stroke="none" />

      {/* Glowing dot on path */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={dotSize * 2}
        strokeLinecap="round"
        opacity="0.4"
      >
        <animate
          attributeName="stroke-dasharray"
          values={`0 1000;${dotSize * 10} 1000`}
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          values={reverse ? `0;-${1000}` : `${1000};0`}
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
};

AnimatedBeam.displayName = "AnimatedBeam";
