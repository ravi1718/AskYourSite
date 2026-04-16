"use client";

import { CheckCircle2 } from "lucide-react";

const TRIGGER_LABELS: Record<string, string> = {
  explicit_request: "Visitor explicitly requested a human",
  urgency: "Urgent request detected",
  frustration: "High frustration level detected",
  unanswered_streak: "AI couldn't answer 2+ questions in a row",
  repeated_question: "Visitor repeated the same question 3 times",
};

interface VisitorPanelProps {
  handoff: {
    status: string;
    trigger_reason: string;
    trigger_message: string;
    ai_summary: string | null;
    visitor_name: string | null;
    visitor_email: string | null;
    visitor_sentiment: number | null;
    assistantName: string;
    created_at: string;
  };
  onResolve: () => void;
  resolving: boolean;
}

function SentimentIndicator({ score }: { score: number }) {
  const color =
    score >= 4 ? "text-red-400" : score >= 3 ? "text-amber-400" : "text-emerald-400";
  const label =
    score >= 4 ? "Very frustrated" : score >= 3 ? "Somewhat frustrated" : "Calm";
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2 w-3 rounded-sm ${i <= Math.round(score) ? (score >= 4 ? "bg-red-400" : score >= 3 ? "bg-amber-400" : "bg-emerald-400") : "bg-white/10"}`}
          />
        ))}
      </div>
      <span className={`text-xs ${color}`}>{label}</span>
    </div>
  );
}

export function VisitorPanel({ handoff, onResolve, resolving }: VisitorPanelProps) {
  const visitorLabel = handoff.visitor_name ?? handoff.visitor_email ?? "Anonymous visitor";
  const canResolve = handoff.status === "active" || handoff.status === "waiting";

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1">
      {/* Visitor identity */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Visitor</p>
        <p className="text-base font-semibold text-white">{visitorLabel}</p>
        {handoff.visitor_email && handoff.visitor_name && (
          <p className="text-sm text-slate-400">{handoff.visitor_email}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">via {handoff.assistantName}</p>
      </div>

      {/* Sentiment */}
      {handoff.visitor_sentiment !== null && handoff.visitor_sentiment > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Frustration level</p>
          <SentimentIndicator score={handoff.visitor_sentiment} />
        </div>
      )}

      {/* Trigger */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">Why escalated</p>
        <p className="text-sm text-amber-200">{TRIGGER_LABELS[handoff.trigger_reason] ?? handoff.trigger_reason}</p>
        {handoff.trigger_message && (
          <p className="text-xs text-slate-400 mt-2 italic">"{handoff.trigger_message}"</p>
        )}
      </div>

      {/* AI Summary */}
      {handoff.ai_summary && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">AI Summary</p>
          <p className="text-sm text-slate-300 leading-relaxed">{handoff.ai_summary}</p>
        </div>
      )}

      {/* Resolve button */}
      {canResolve && (
        <button
          onClick={onResolve}
          disabled={resolving}
          className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          {resolving ? "Resolving…" : "Resolve Conversation"}
        </button>
      )}
    </div>
  );
}
