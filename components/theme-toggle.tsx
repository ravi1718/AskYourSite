"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("h-10 w-24 rounded-full border border-white/10 bg-white/5", className)} />;
  }

  const isDark = theme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur",
        "transition-all duration-300 ease-out hover:bg-white/10 hover:border-white/20 dark:text-slate-100",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
        className,
      )}
    >
      <span className="relative h-4 w-4 overflow-hidden">
        <SunMedium
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300 ease-spring",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300 ease-spring",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
      </span>
      <span className="transition-all duration-200">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
