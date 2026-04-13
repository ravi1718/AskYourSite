"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Zap, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  capture_lead:           "Capture Lead",
  book_demo:              "Book Demo",
  recommend_product:      "Recommend Product",
  trigger_discount:       "Trigger Discount",
  send_notification:      "Send Notification",
  assign_human_agent:     "Assign Human Agent",
  update_crm:             "Update CRM",
  track_event:            "Track Event",
  personalize_experience: "Personalize Experience",
};

const ACTION_COLORS: Record<string, string> = {
  capture_lead:           "text-blue-400 bg-blue-500/10 border-blue-500/20",
  book_demo:              "text-violet-400 bg-violet-500/10 border-violet-500/20",
  recommend_product:      "text-amber-400 bg-amber-500/10 border-amber-500/20",
  trigger_discount:       "text-pink-400 bg-pink-500/10 border-pink-500/20",
  send_notification:      "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  assign_human_agent:     "text-orange-400 bg-orange-500/10 border-orange-500/20",
  update_crm:             "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  track_event:            "text-slate-400 bg-slate-500/10 border-slate-500/20",
  personalize_experience: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

interface Log {
  id: string;
  action: string;
  trigger_reason: string;
  payload: any;
  endpoint_url: string;
  response_status: number | null;
  fired_at: string;
  session_id: string;
}

export function AgentLogsClient({ assistants }: { assistants: { id: string; name: string }[] }) {
  const [selectedAssistant, setSelectedAssistant] = useState(assistants[0]?.id || "");
  const [selectedAction, setSelectedAction] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAssistant) fetchLogs();
  }, [selectedAssistant, selectedAction]);

  async function fetchLogs() {
    if (!selectedAssistant) return;
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (selectedAction) params.set("action", selectedAction);
    const res = await fetch(`/api/assistants/${selectedAssistant}/agent-log?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const successCount = logs.filter(l => l.response_status && l.response_status >= 200 && l.response_status < 300).length;
  const failCount = logs.filter(l => !l.response_status || l.response_status >= 400).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-violet-400" />
            Agent Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Every outbound webhook fired by your agents — real-time audit trail.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Fired", value: logs.length, color: "text-white" },
          { label: "Successful", value: successCount, color: "text-emerald-400" },
          { label: "Failed", value: failCount, color: "text-red-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={selectedAssistant}
            onChange={e => setSelectedAssistant(e.target.value)}
            className="appearance-none bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white pr-9 focus:outline-none focus:border-violet-500/50"
          >
            {assistants.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
            className="appearance-none bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white pr-9 focus:outline-none focus:border-violet-500/50"
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="h-10 w-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No agent actions recorded yet.</p>
            <p className="text-sm text-slate-600 mt-1">
              Enable Agent Mode and configure webhooks in your assistant settings to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map(log => {
              const isSuccess = log.response_status && log.response_status >= 200 && log.response_status < 300;
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors text-left"
                  >
                    {isSuccess
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    }
                    <span className={cn(
                      "text-xs font-mono px-2 py-0.5 rounded-md border shrink-0",
                      ACTION_COLORS[log.action] || "text-slate-400 bg-slate-500/10 border-slate-500/20"
                    )}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    <span className="flex-1 text-sm text-slate-300 truncate min-w-0">
                      {log.trigger_reason || "—"}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded shrink-0",
                      isSuccess ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                    )}>
                      {log.response_status ?? "timeout"}
                    </span>
                    <span className="text-xs text-slate-600 shrink-0 w-20 text-right">
                      {formatTime(log.fired_at)}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-slate-600 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 bg-background/40 border-t border-border/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Endpoint</p>
                          <p className="text-xs text-slate-300 font-mono break-all">{log.endpoint_url || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Session</p>
                          <p className="text-xs text-slate-400 font-mono">{log.session_id || "—"}</p>
                        </div>
                        {log.payload && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Payload</p>
                            <pre className="text-xs text-slate-300 bg-background border border-border rounded-xl p-3 overflow-x-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
