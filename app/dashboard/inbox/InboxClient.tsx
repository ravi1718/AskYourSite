"use client";

import { useState, useEffect, useCallback } from "react";
import { HandoffCard } from "./HandoffCard";
import { Headphones, RefreshCw } from "lucide-react";

interface Handoff {
  id: string;
  assistant_id: string;
  assistantName: string;
  status: "waiting" | "active";
  trigger_reason: string;
  ai_summary: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_sentiment: number | null;
  join_token: string;
  created_at: string;
}

interface InboxClientProps {
  initialHandoffs: Handoff[];
}

export function InboxClient({ initialHandoffs }: InboxClientProps) {
  const [handoffs, setHandoffs] = useState<Handoff[]>(initialHandoffs);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Set initial time only on client to avoid hydration mismatch
  useEffect(() => {
    setLastRefresh(new Date());
  }, []);

  const fetchHandoffs = useCallback(async () => {
    try {
      const res = await fetch("/api/handoff/inbox");
      if (!res.ok) return;
      const data = await res.json();
      setHandoffs(data.handoffs ?? []);
      setLastRefresh(new Date());
    } catch {
      // Non-fatal
    }
  }, []);

  // Poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchHandoffs, 10_000);
    return () => clearInterval(interval);
  }, [fetchHandoffs]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchHandoffs();
    setLoading(false);
  };

  const waiting = handoffs.filter((h) => h.status === "waiting");
  const active = handoffs.filter((h) => h.status === "active");

  if (handoffs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Headphones className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">All clear</h3>
          <p className="text-slate-400 text-sm mt-1">
            No visitors waiting for support right now.
          </p>
        </div>
        <p className="text-xs text-slate-600">
          Last checked {lastRefresh ? lastRefresh.toLocaleTimeString() : "–"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Refresh control */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Auto-refreshes every 10s · Last at {lastRefresh ? lastRefresh.toLocaleTimeString() : "–"}
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Waiting */}
      {waiting.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
            Waiting for agent ({waiting.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {waiting.map((h) => (
              <HandoffCard key={h.id} handoff={h} />
            ))}
          </div>
        </section>
      )}

      {/* Active */}
      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            Active conversations ({active.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((h) => (
              <HandoffCard key={h.id} handoff={h} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
