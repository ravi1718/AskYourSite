"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathname = useRef(pathname);
  const navigatingRef = useRef(false);

  function startProgress() {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setVisible(true);
    setProgress(15);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(timerRef.current!);
          return 85;
        }
        return prev + (85 - prev) * 0.08;
      });
    }, 100);
  }

  // Intercept history.pushState — fired by Next.js Link and router.push
  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);

    window.history.pushState = (...args: Parameters<typeof window.history.pushState>) => {
      startProgress();
      return originalPushState(...args);
    };

    return () => {
      window.history.pushState = originalPushState;
    };
  }, []);

  // Complete the bar when pathname actually changes
  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (!navigatingRef.current) return;
    navigatingRef.current = false;

    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] pointer-events-none"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
        transition: progress === 100 ? "width 0.3s ease-out" : "width 0.1s linear",
        boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)",
      }}
    />
  );
}
