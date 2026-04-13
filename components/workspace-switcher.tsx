"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Loader2 } from "lucide-react";

interface WorkspaceSwitcherProps {
  /** Current mode: "team" = viewing team workspace, "personal" = viewing own workspace */
  currentMode: "team" | "personal";
  ownerName: string;
}

export function WorkspaceSwitcher({ currentMode, ownerName }: WorkspaceSwitcherProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSwitch() {
    setLoading(true);
    const nextMode = currentMode === "team" ? "personal" : "team";
    await fetch("/api/workspace/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: nextMode }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={loading}
      className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
      title={currentMode === "team" ? "Switch to your personal workspace" : `Switch back to ${ownerName}`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <ArrowLeftRight className="h-3 w-3" />
      )}
      {currentMode === "team" ? "Switch to personal" : `Switch to ${ownerName}`}
    </button>
  );
}
