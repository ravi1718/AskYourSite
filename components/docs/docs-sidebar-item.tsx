"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Rocket, Puzzle, Layers, CreditCard, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection } from "@/lib/docs/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Puzzle,
  Layers,
  CreditCard,
  Code2,
};

const BADGE_STYLES: Record<string, string> = {
  "coming-soon": "bg-slate-800 text-slate-400 border-slate-700",
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  beta: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

interface Props {
  section: NavSection;
  pathname: string;
  defaultOpen: boolean;
}

export function DocsSidebarItem({ section, pathname, defaultOpen }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = ICONS[section.icon] ?? Layers;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors group"
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider">{section.title}</span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200 flex-shrink-0",
            open && "rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-[#1A1A1A] space-y-0.5">
          {section.items.map((item) => {
            const isActive = pathname === `/docs/${item.section}/${item.slug}`;
            return (
              <Link
                key={item.slug}
                href={`/docs/${item.section}/${item.slug}`}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-blue-500/10 text-blue-400 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="flex-1 text-[13px]">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded border leading-none",
                      BADGE_STYLES[item.badge] ?? BADGE_STYLES["new"]
                    )}
                  >
                    {item.badge === "coming-soon" ? "Soon" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
