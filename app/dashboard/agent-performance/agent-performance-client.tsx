"use client";

import { useState, useEffect } from "react";
import { BarChart3, Zap, Users, CheckCircle2, XCircle, TrendingUp, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  capture_lead: "Capture Lead",
  book_demo: "Book Demo",
  recommend_product: "Recommend Product",
  trigger_discount: "Trigger Discount",
  send_notification: "Send Notification",
  assign_human_agent: "Assign Human Agent",
  update_crm: "Update CRM",
  track_event: "Track Event",
  personalize_experience: "Personalize Experience",
};

interface Stats {
  totalActions: number;
  successActions: number;
  failedActions: number;
  successRate: number;
  totalLeads: number;
  totalWorkflowRuns: number;
  completedWorkflowRuns: number;
  newVisitors: number;
  returningVisitors: number;
  avgSentiment: number | null;
  topActions: { action: string; count: number; success: number }[];
  recentLogs: { id: string; action: string; trigger_reason: string; response_status: number | null; fired_at: string; endpoint_url: string }[];
}

export function AgentPerformanceClient({ assistants }: { assistants: { id: string; name: string }[] }) {
  const [selectedAssistant, setSelectedAssistant] = useState(assistants[0]?.id || "");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAssistant) fetchStats();
  }, [selectedAssistant]);

  async function fetchStats() {
    if (!selectedAssistant) return;
    setLoading(true);
    try {
      const [logsRes, leadsRes, workflowsRes, visitorsRes] = await Promise.all([
        fetch(`/api/assistants/${selectedAssistant}/agent-log?limit=200`),
        fetch(`/api/assistants/${selectedAssistant}/leads-count`),
        fetch(`/api/assistants/${selectedAssistant}/workflows`),
        fetch(`/api/visitors/${selectedAssistant}?limit=200`),
      ]);

      const logsData = logsRes.ok ? await logsRes.json() : { logs: [] };
      const leadsData = leadsRes.ok ? await leadsRes.json() : { count: 0 };
      const workflowsData = workflowsRes.ok ? await workflowsRes.json() : { workflows: [] };
      const visitorsData = visitorsRes.ok ? await visitorsRes.json() : { visitors: [] };

      const logs: any[] = logsData.logs || [];
      const visitors: any[] = visitorsData.visitors || [];

      const successLogs = logs.filter(l => l.response_status && l.response_status >= 200 && l.response_status < 300);
      const failedLogs = logs.filter(l => !l.response_status || l.response_status >= 400);

      // Aggregate by action
      const actionMap = new Map<string, { count: number; success: number }>();
      for (const log of logs) {
        const existing = actionMap.get(log.action) || { count: 0, success: 0 };
        existing.count++;
        if (log.response_status && log.response_status >= 200 && log.response_status < 300) existing.success++;
        actionMap.set(log.action, existing);
      }
      const topActions = [...actionMap.entries()]
        .map(([action, data]) => ({ action, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Workflow stats from run_count
      const workflows: any[] = workflowsData.workflows || [];
      const totalWorkflowRuns = workflows.reduce((sum: number, w: any) => sum + (w.run_count || 0), 0);

      // Visitor stats
      const newVisitors = visitors.filter(v => v.total_sessions === 1).length;
      const returningVisitors = visitors.filter(v => v.total_sessions > 1).length;
      const sentimentValues = visitors.filter(v => v.sentiment_avg != null).map(v => v.sentiment_avg);
      const avgSentiment = sentimentValues.length
        ? sentimentValues.reduce((a: number, b: number) => a + b, 0) / sentimentValues.length
        : null;

      setStats({
        totalActions: logs.length,
        successActions: successLogs.length,
        failedActions: failedLogs.length,
        successRate: logs.length ? Math.round((successLogs.length / logs.length) * 100) : 0,
        totalLeads: leadsData.count || 0,
        totalWorkflowRuns,
        completedWorkflowRuns: totalWorkflowRuns, // approximation
        newVisitors,
        returningVisitors,
        avgSentiment,
        topActions,
        recentLogs: logs.slice(0, 10),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const sentimentLabel = (score: number) => {
    if (score <= 1.5) return { label: "Very Calm", color: "text-emerald-400" };
    if (score <= 2.5) return { label: "Calm", color: "text-green-400" };
    if (score <= 3.5) return { label: "Mixed", color: "text-amber-400" };
    if (score <= 4.5) return { label: "Frustrated", color: "text-orange-400" };
    return { label: "Very Frustrated", color: "text-red-400" };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-violet-400" />
            Agent Performance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            What your agent did — leads captured, actions fired, workflows run.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedAssistant}
              onChange={e => setSelectedAssistant(e.target.value)}
              className="appearance-none bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white pr-9 focus:outline-none focus:border-violet-500/50"
            >
              {assistants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : !stats ? null : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Actions Fired", value: stats.totalActions, color: "text-violet-400", icon: Zap },
              { label: "Leads Captured", value: stats.totalLeads, color: "text-emerald-400", icon: TrendingUp },
              { label: "Success Rate", value: `${stats.successRate}%`, color: "text-blue-400", icon: CheckCircle2 },
              { label: "Workflow Runs", value: stats.totalWorkflowRuns, color: "text-amber-400", icon: BarChart3 },
            ].map(stat => (
              <div key={stat.label} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Two-column: Actions breakdown + Visitor insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top Actions */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-400" /> Top Actions
              </h2>
              {stats.topActions.length === 0 ? (
                <p className="text-xs text-slate-500">No actions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topActions.map(a => (
                    <div key={a.action} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{ACTION_LABELS[a.action] || a.action}</p>
                        <div className="h-1.5 bg-slate-800 rounded-full mt-1">
                          <div
                            className="h-1.5 bg-violet-500 rounded-full"
                            style={{ width: `${Math.round((a.success / a.count) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-white">{a.count}</p>
                        <p className="text-xs text-slate-500">{Math.round((a.success / a.count) * 100)}% ok</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visitor insights */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" /> Visitor Insights
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">New visitors</span>
                  <span className="text-sm font-medium text-white">{stats.newVisitors}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Returning visitors</span>
                  <span className="text-sm font-medium text-emerald-400">{stats.returningVisitors}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Avg sentiment</span>
                  {stats.avgSentiment != null ? (
                    <span className={cn("text-sm font-medium", sentimentLabel(stats.avgSentiment).color)}>
                      {stats.avgSentiment.toFixed(1)}/5 — {sentimentLabel(stats.avgSentiment).label}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">No data</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Actions succeeded</span>
                  <span className="text-sm font-medium text-emerald-400">{stats.successActions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Actions failed</span>
                  <span className="text-sm font-medium text-red-400">{stats.failedActions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-white">Recent Agent Actions</h2>
            </div>
            {stats.recentLogs.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No actions fired yet. Enable Agent Mode and configure webhooks.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentLogs.map(log => {
                  const isOk = log.response_status && log.response_status >= 200 && log.response_status < 300;
                  return (
                    <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                      {isOk
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                      <span className="text-xs text-violet-400 font-mono shrink-0">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span className="flex-1 text-sm text-slate-400 truncate min-w-0">
                        {log.trigger_reason || "—"}
                      </span>
                      <span className={cn("text-xs shrink-0", isOk ? "text-emerald-400" : "text-red-400")}>
                        {log.response_status ?? "timeout"}
                      </span>
                      <span className="text-xs text-slate-600 shrink-0 w-16 text-right">
                        {formatTime(log.fired_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
