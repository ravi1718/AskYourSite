"use client";

function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TRIGGER_LABELS: Record<string, string> = {
  explicit_request: "Visitor explicitly requested a human",
  urgency: "Urgent request detected",
  frustration: "High frustration level detected",
  unanswered_streak: "AI couldn't answer 2+ questions in a row",
  repeated_question: "Visitor repeated the same question 3 times",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

interface HandoffCardProps {
  handoff: {
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
  };
}

function SentimentBar({ score }: { score: number }) {
  const pct = Math.round((score / 5) * 100);
  const color =
    score >= 4 ? "bg-red-500" : score >= 3 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400">{score.toFixed(1)}/5</span>
    </div>
  );
}

export function HandoffCard({ handoff }: HandoffCardProps) {
  const isWaiting = handoff.status === "waiting";
  const visitorLabel = handoff.visitor_name
    ? `${handoff.visitor_name}${handoff.visitor_email ? ` · ${handoff.visitor_email}` : ""}`
    : handoff.visitor_email ?? "Anonymous visitor";

  const joinUrl = `${APP_URL}/live-chat/${handoff.join_token}`;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isWaiting
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isWaiting ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}
            />
            {isWaiting ? "WAITING" : "ACTIVE"}
          </span>
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(handoff.created_at))}
          </span>
        </div>
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary/80 transition-colors"
        >
          Join →
        </a>
      </div>

      {/* Visitor + assistant */}
      <div>
        <p className="text-sm font-medium text-white">{visitorLabel}</p>
        <p className="text-xs text-slate-500 mt-0.5">{handoff.assistantName}</p>
      </div>

      {/* Trigger */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
        <p className="text-xs text-amber-300 font-medium">
          ⚠️ {TRIGGER_LABELS[handoff.trigger_reason] ?? handoff.trigger_reason}
        </p>
      </div>

      {/* AI summary */}
      {handoff.ai_summary && (
        <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-primary/40 pl-3">
          "{handoff.ai_summary}"
        </p>
      )}

      {/* Sentiment */}
      {handoff.visitor_sentiment !== null && handoff.visitor_sentiment > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Frustration</span>
          <SentimentBar score={handoff.visitor_sentiment} />
        </div>
      )}
    </div>
  );
}
