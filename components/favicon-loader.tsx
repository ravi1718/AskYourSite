"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getFaviconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  return link;
}

export function FaviconLoader() {
  const pathname = usePathname();
  const isNavigating = useRef(false);
  const prevPathname = useRef(pathname);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;

      isNavigating.current = true;
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      getFaviconLink().href = "/favicon-loading.svg";
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== prevPathname.current && isNavigating.current) {
      prevPathname.current = pathname;
      isNavigating.current = false;

      resetTimerRef.current = setTimeout(() => {
        getFaviconLink().href = "/favicon.svg";
      }, 150);
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  return null;
}
