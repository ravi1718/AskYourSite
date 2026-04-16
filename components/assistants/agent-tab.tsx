"use client";

import { useState, useEffect } from "react";
import { Zap, Plus, Trash2, TestTube2, ChevronDown, CheckCircle2, XCircle, Clock, ToggleLeft, ToggleRight, Loader2, Bell, Headphones, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WebhookModal } from "./webhook-modal";


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

interface Webhook {
  id: string;
  name: string;
  action: string;
  endpoint_url: string;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
}

interface AgentLog {
  id: string;
  action: string;
  trigger_reason: string;
  endpoint_url: string;
  response_status: number | null;
  fired_at: string;
}

export function AgentTab({
  assistantId,
  widgetConfig,
  onConfigChange,
  onSave,
  saving,
  featureFlags = {},
}: {
  assistantId: string;
  widgetConfig: Record<string, any>;
  onConfigChange: (key: string, value: any) => void;
  onSave: () => void;
  saving: boolean;
  featureFlags?: Record<string, boolean>;
}) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; status?: number }>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Proactive triggers state
  const [triggers, setTriggers] = useState<any[]>([]);
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [newTrigger, setNewTrigger] = useState({ name: "", trigger_type: "time_on_page", seconds: 60, percent: 80, visit_count: 2, url_pattern: "", message: "", cooldown_hours: 24 });
  const [savingTrigger, setSavingTrigger] = useState(false);

  const isAgentMode = widgetConfig.agentMode === true;

  useEffect(() => {
    fetchWebhooks();
    fetchLogs();
    fetchTriggers();
  }, [assistantId]);

  async function fetchTriggers() {
    const res = await fetch(`/api/assistants/${assistantId}/triggers`);
    const data = await res.json();
    setTriggers(data.triggers || []);
  }

  async function handleSaveTrigger() {
    if (!newTrigger.name || !newTrigger.message) return;
    setSavingTrigger(true);
    const conditionValue =
      newTrigger.trigger_type === "time_on_page" || newTrigger.trigger_type === "inactivity" ? { seconds: newTrigger.seconds }
      : newTrigger.trigger_type === "scroll_depth" ? { percent: newTrigger.percent }
      : newTrigger.trigger_type === "return_visit" ? { visit_count: newTrigger.visit_count }
      : {};
    const res = await fetch(`/api/assistants/${assistantId}/triggers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTrigger.name,
        trigger_type: newTrigger.trigger_type,
        condition_value: conditionValue,
        url_pattern: newTrigger.url_pattern || null,
        message: newTrigger.message,
        cooldown_hours: newTrigger.cooldown_hours,
      }),
    });
    const data = await res.json();
    if (data.trigger) {
      setTriggers(prev => [data.trigger, ...prev]);
      setShowTriggerForm(false);
      setNewTrigger({ name: "", trigger_type: "time_on_page", seconds: 60, percent: 80, visit_count: 2, url_pattern: "", message: "", cooldown_hours: 24 });
    }
    setSavingTrigger(false);
  }

  async function handleDeleteTrigger(id: string) {
    await fetch(`/api/assistants/${assistantId}/triggers/${id}`, { method: "DELETE" });
    setTriggers(prev => prev.filter(t => t.id !== id));
  }

  async function handleToggleTrigger(trigger: any) {
    await fetch(`/api/assistants/${assistantId}/triggers/${trigger.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !trigger.is_active }),
    });
    setTriggers(prev => prev.map(t => t.id === trigger.id ? { ...t, is_active: !t.is_active } : t));
  }

  async function fetchWebhooks() {
    setLoadingWebhooks(true);
    const res = await fetch(`/api/assistants/${assistantId}/webhooks`);
    const data = await res.json();
    setWebhooks(data.webhooks || []);
    setLoadingWebhooks(false);
  }

  async function fetchLogs() {
    setLoadingLogs(true);
    const res = await fetch(`/api/assistants/${assistantId}/agent-log?limit=20`);
    const data = await res.json();
    setLogs(data.logs || []);
    setLoadingLogs(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/assistants/${assistantId}/webhooks/${id}`, { method: "DELETE" });
    setWebhooks(prev => prev.filter(w => w.id !== id));
    setDeletingId(null);
  }

  async function handleTest(webhook: Webhook) {
    setTestingId(webhook.id);
    const res = await fetch(`/api/assistants/${assistantId}/webhooks/${webhook.id}/test`, { method: "POST" });
    const data = await res.json();
    setTestResults(prev => ({ ...prev, [webhook.id]: { ok: data.success, status: data.status } }));
    setTestingId(null);
  }

  async function handleToggle(webhook: Webhook) {
    const res = await fetch(`/api/assistants/${assistantId}/webhooks/${webhook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !webhook.is_active }),
    });
    if (res.ok) {
      setWebhooks(prev => prev.map(w => w.id === webhook.id ? { ...w, is_active: !w.is_active } : w));
    }
  }

  function handleWebhookCreated(webhook: Webhook) {
    setWebhooks(prev => [webhook, ...prev]);
    setShowModal(false);
  }

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="space-y-6">
      {/* Agent Mode Toggle */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Zap className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Agent Mode</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Transform your assistant from a chatbot into an autonomous agent that classifies intent and triggers actions.
              </p>
            </div>
          </div>
          <button
            onClick={() => onConfigChange("agentMode", !isAgentMode)}
            className="shrink-0"
          >
            {isAgentMode
              ? <ToggleRight className="h-9 w-9 text-violet-400" />
              : <ToggleLeft className="h-9 w-9 text-slate-500" />
            }
          </button>
        </div>

        {isAgentMode && (
          <div className="mt-5 pt-5 border-t border-border">
            {/* Unified Agent Instructions */}
            <label className="block text-sm font-medium text-slate-300 mb-2">Agent Instructions</label>
            <textarea
              value={widgetConfig.agentInstructions || widgetConfig.agentGoal || ""}
              onChange={e => onConfigChange("agentInstructions", e.target.value)}
              placeholder={"You are Alex, a friendly sales advisor. Your goal is to understand what visitors are looking for, capture their name and email, and book product demos.\n\nNever discuss competitor pricing. Always be helpful and concise."}
              rows={5}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Describe what this agent should do and how it should behave — all in plain English.
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button
            onClick={onSave}
            disabled={saving}
                        className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Human Handoff Toggle */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Headphones className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Human Handoff</h3>
                {!featureFlags.human_handoff && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> BUSINESS
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Automatically connect frustrated or stuck visitors to your team. You'll get an email and inbox notification.
              </p>
            </div>
          </div>
          {featureFlags.human_handoff ? (
            <button
              onClick={() => onConfigChange("humanHandoffEnabled", !widgetConfig.humanHandoffEnabled)}
              className="shrink-0"
            >
              {widgetConfig.humanHandoffEnabled
                ? <ToggleRight className="h-9 w-9 text-orange-400" />
                : <ToggleLeft className="h-9 w-9 text-slate-500" />
              }
            </button>
          ) : (
            <ToggleLeft className="h-9 w-9 text-slate-700 cursor-not-allowed" />
          )}
        </div>

        {featureFlags.human_handoff && widgetConfig.humanHandoffEnabled && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-slate-400 leading-relaxed">
              The AI detects these signals and escalates automatically:
            </p>
            <ul className="mt-2 space-y-1">
              {[
                "Visitor explicitly asks for a human",
                "Urgent or time-sensitive language detected",
                "Visitor frustration score ≥ 4/5",
                "AI couldn't answer 2+ questions in a row",
                "Same question repeated 3 times",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-1 w-1 rounded-full bg-orange-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {featureFlags.human_handoff && (
          <div className="mt-5 flex justify-end">
            <Button
              onClick={onSave}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-500 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Settings
            </Button>
          </div>
        )}
      </div>

      {/* Outbound Webhooks */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-white">Outbound Webhooks</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              When the agent detects an intent, it POSTs to your server — fire-and-forget, never blocking the chat.
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
                        className="bg-violet-600 hover:bg-violet-500 text-white shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Webhook
          </Button>
        </div>

        {loadingWebhooks ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <Zap className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No webhooks configured yet.</p>
            <p className="text-xs text-slate-600 mt-1">Add one so the agent can trigger actions on your server.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-colors",
                  webhook.is_active ? "border-border bg-background" : "border-border/40 bg-background/40 opacity-60"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-md">
                      {ACTION_LABELS[webhook.action] || webhook.action}
                    </span>
                    <span className="text-sm font-medium text-white">{webhook.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{webhook.endpoint_url}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                    <span>{webhook.trigger_count} triggers</span>
                    {webhook.last_triggered_at && (
                      <span>Last: {formatTimeAgo(webhook.last_triggered_at)}</span>
                    )}
                    {testResults[webhook.id] && (
                      <span className={testResults[webhook.id].ok ? "text-emerald-400" : "text-red-400"}>
                        Test: {testResults[webhook.id].ok ? `✓ ${testResults[webhook.id].status}` : `✗ Failed`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(webhook)}
                    title={webhook.is_active ? "Disable" : "Enable"}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {webhook.is_active
                      ? <ToggleRight className="h-4 w-4 text-violet-400" />
                      : <ToggleLeft className="h-4 w-4" />
                    }
                  </button>
                  <button
                    onClick={() => handleTest(webhook)}
                    disabled={testingId === webhook.id}
                    title="Send test POST"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {testingId === webhook.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <TestTube2 className="h-4 w-4" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    disabled={deletingId === webhook.id}
                    title="Delete"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    {deletingId === webhook.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proactive Triggers */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" /> Proactive Triggers
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Open the chat automatically based on visitor behavior — no visitor action required.
            </p>
          </div>
          <Button
            onClick={() => setShowTriggerForm(v => !v)}
                        className="bg-amber-600/80 hover:bg-amber-500 text-white shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Trigger
          </Button>
        </div>

        {showTriggerForm && (
          <div className="mb-5 p-4 rounded-xl bg-background border border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Trigger name</label>
                <input
                  type="text"
                  value={newTrigger.name}
                  onChange={e => setNewTrigger(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Pricing page 60s"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Trigger type</label>
                <div className="relative">
                  <select
                    value={newTrigger.trigger_type}
                    onChange={e => setNewTrigger(p => ({ ...p, trigger_type: e.target.value, message: "" }))}
                    className="w-full appearance-none bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white pr-8 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="time_on_page">Time on page</option>
                    <option value="exit_intent">Exit intent</option>
                    <option value="return_visit">Return visit</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {newTrigger.trigger_type === "time_on_page" && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Seconds on page</label>
                  <input type="number" min={5} value={newTrigger.seconds} onChange={e => setNewTrigger(p => ({ ...p, seconds: parseInt(e.target.value) || 30 }))}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                </div>
              )}
              {newTrigger.trigger_type === "return_visit" && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Fire on visit number</label>
                  <input type="number" min={2} value={newTrigger.visit_count} onChange={e => setNewTrigger(p => ({ ...p, visit_count: parseInt(e.target.value) || 2 }))}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Only on page <span className="text-slate-600">(optional)</span></label>
                <input type="text" value={newTrigger.url_pattern} onChange={e => setNewTrigger(p => ({ ...p, url_pattern: e.target.value }))}
                  placeholder="/pricing"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Opening message</label>
              <textarea value={newTrigger.message} onChange={e => setNewTrigger(p => ({ ...p, message: e.target.value }))}
                placeholder="e.g. Need help deciding on a plan? I can answer any questions."
                rows={2}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none"
              />
              {/* Message suggestions */}
              {(() => {
                const suggestions: Record<string, string[]> = {
                  time_on_page: ["Taking a look around? I'm here if you have questions 👋", "Can I help you find what you're looking for?", "Been here a while — need a quick summary?"],
                  exit_intent: ["Wait — before you go, can I answer any questions?", "Don't leave yet! I can help you in 30 seconds.", "Anything stopping you from moving forward?"],
                  return_visit: ["Welcome back! Still researching? I can help.", "Great to see you again — what can I help you with today?", "You've visited before — ready to take the next step?"],
                };
                const list = suggestions[newTrigger.trigger_type] || [];
                if (!list.length) return null;
                return (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {list.map(s => (
                      <button key={s} type="button"
                        onClick={() => setNewTrigger(p => ({ ...p, message: s }))}
                        className="text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white px-2 py-1 rounded-lg transition-colors text-left">
                        {s}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Cooldown:</label>
                <input type="number" min={1} value={newTrigger.cooldown_hours} onChange={e => setNewTrigger(p => ({ ...p, cooldown_hours: parseInt(e.target.value) || 24 }))}
                  className="w-16 bg-surface border border-border rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                <span className="text-xs text-slate-500">hours</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowTriggerForm(false)} className="text-slate-400 text-sm px-3 py-1.5">Cancel</Button>
                <Button onClick={handleSaveTrigger} disabled={savingTrigger || !newTrigger.name || !newTrigger.message}
                  className="bg-amber-600/80 hover:bg-amber-500 text-white text-sm px-3 py-1.5">
                  {savingTrigger ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Trigger"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {triggers.length === 0 && !showTriggerForm ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <Bell className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No proactive triggers yet.</p>
            <p className="text-xs text-slate-600 mt-1">Add one to open the chat automatically based on visitor behavior.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {triggers.map(trigger => (
              <div key={trigger.id} className={cn("flex items-center gap-3 p-3 rounded-xl border", trigger.is_active ? "border-border bg-background" : "border-border/40 bg-background/40 opacity-60")}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md capitalize">
                      {trigger.trigger_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium text-white">{trigger.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">"{trigger.message}"</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {trigger.url_pattern ? `On pages matching: ${trigger.url_pattern} · ` : ""}
                    Cooldown: {trigger.cooldown_hours}h · Fired: {trigger.fire_count} times
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggleTrigger(trigger)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                    {trigger.is_active ? <ToggleRight className="h-4 w-4 text-amber-400" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button onClick={() => handleDeleteTrigger(trigger.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Activity Log */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-white">Activity Log</h3>
            <p className="text-sm text-slate-400 mt-0.5">Last 20 webhook calls fired by this agent.</p>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>

        {loadingLogs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <Clock className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No actions fired yet.</p>
            <p className="text-xs text-slate-600 mt-1">Enable Agent Mode and configure a webhook to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/60">
                {log.response_status && log.response_status >= 200 && log.response_status < 300
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-md">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    <span className="text-xs text-slate-500">{formatTimeAgo(log.fired_at)}</span>
                    {log.response_status && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        log.response_status >= 200 && log.response_status < 300
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-red-400 bg-red-500/10"
                      )}>
                        {log.response_status}
                      </span>
                    )}
                  </div>
                  {log.trigger_reason && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{log.trigger_reason}</p>
                  )}
                  {log.endpoint_url && (
                    <p className="text-xs text-slate-600 truncate">{log.endpoint_url}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <WebhookModal
          assistantId={assistantId}
          onClose={() => setShowModal(false)}
          onCreated={handleWebhookCreated}
        />
      )}
    </div>
  );
}
