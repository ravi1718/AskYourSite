"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";

export function SignupTracker() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      sendGAEvent("event", "sign_up", { method: "google" });
      // Remove the param from the URL without a full navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
