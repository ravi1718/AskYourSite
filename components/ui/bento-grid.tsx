"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface BentoCardProps {
  name: string;
  description: string;
  background: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
  accentColor: string;
}

export function BentoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid auto-rows-[22rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  description,
  background,
  icon,
  className,
  accentColor,
}: BentoCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0f0f0f] flex flex-col",
        className
      )}
      whileHover={{
        y: -4,
        boxShadow: `0 0 0 1px ${accentColor}40, 0 12px 40px ${accentColor}20`,
        transition: { duration: 0.25, ease: "easeOut" },
      }}
    >
      {/* Animated background preview — fills top portion */}
      <div className="relative flex-1 overflow-hidden">
        {background}
        {/* Fade mask blending background into card content */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
      </div>

      {/* Card content */}
      <div className="relative z-10 flex flex-col gap-2 p-5 pt-0">
        <div className="mb-1 w-fit transition-transform duration-300 ease-out group-hover:scale-90 group-hover:origin-left">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-white">{name}</h3>
        <p className="text-sm text-white/50 leading-relaxed">{description}</p>
        {/* Coming Soon badge */}
        <span
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
          style={{
            borderColor: `${accentColor}40`,
            color: accentColor,
            backgroundColor: `${accentColor}15`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
          Coming Soon
        </span>
      </div>
    </motion.div>
  );
}
