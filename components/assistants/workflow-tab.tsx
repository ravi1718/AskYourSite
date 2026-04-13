"use client";

import { useState, useEffect, useRef } from "react";
import {
  GitBranch, Plus, Trash2, Pencil, ToggleLeft, ToggleRight,
  Globe, Mail, Clock, ChevronDown, X,
  Loader2, RefreshCw, CheckCircle2, XCircle,
  AlertCircle, ArrowUp, ArrowDown, Copy, Check, Zap, Bell, Calendar, User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepType = "webhook" | "email" | "wait";

interface WebhookStep {
  type: "webhook";
  url: string;
}
interface WaitStep {
  type: "wait";
  seconds: number;
}
interface EmailStep {
  type: "email";
  to_field?: "visitor_email";
  to_static?: string;
  subject?: string;
  body_template?: string;
}
type WorkflowStep = WebhookStep | WaitStep | EmailStep;

interface Workflow {
  id: string;
  name: string;
  trigger_action: string;
  steps: WorkflowStep[];
  is_active: boolean;
  run_count: number;
  created_at: string;
}

interface WorkflowRun {
  id: string;
  status: "running" | "paused" | "completed" | "failed";
  current_step: number;
  total_steps: number;
  next_run_at: string | null;
  started_at: string;
  completed_at: string | null;
  visitor_email: string | null;
  workflow_id: string;
  workflow_name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIGGER_ACTIONS = [
  { value: "capture_lead", label: "Capture Lead" },
  { value: "book_demo", label: "Book Demo" },
  { value: "recommend_product", label: "Recommend Product" },
  { value: "trigger_discount", label: "Trigger Discount" },
  { value: "send_notification", label: "Send Notification" },
  { value: "assign_human_agent", label: "Assign Human Agent" },
  { value: "update_crm", label: "Update CRM" },
  { value: "track_event", label: "Track Event" },
  { value: "personalize_experience", label: "Personalize Experience" },
];

const TEMPLATE_VARS = ["{{name}}", "{{email}}", "{{action}}", "{{reason}}"];

const STEP_CONFIG: Record<StepType, { icon: React.ReactNode; label: string; color: string; accent: string; desc: string }> = {
  webhook: {
    icon: <Globe className="h-4 w-4" />,
    label: "Webhook",
    color: "text-blue-400",
    accent: "border-l-blue-500 bg-blue-500/5",
    desc: "HTTP POST to any endpoint (CRM, Zapier, Slack, etc.)",
  },
  email: {
    icon: <Mail className="h-4 w-4" />,
    label: "Email",
    color: "text-emerald-400",
    accent: "border-l-emerald-500 bg-emerald-500/5",
    desc: "Send email to visitor or your team",
  },
  wait: {
    icon: <Clock className="h-4 w-4" />,
    label: "Wait",
    color: "text-amber-400",
    accent: "border-l-amber-500 bg-amber-500/5",
    desc: "Pause before next step",
  },
};

// ─── Workflow Templates ───────────────────────────────────────────────────────

interface WorkflowTemplate {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  trigger_action: string;
  steps: WorkflowStep[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "lead-welcome-email",
    icon: <Mail className="h-5 w-5 text-emerald-400" />,
    name: "Lead Welcome Email",
    description: "When a lead is captured → wait 30 min → send a welcome email",
    trigger_action: "capture_lead",
    steps: [
      { type: "wait", seconds: 1800 },
      { type: "email", to_field: "visitor_email", subject: "Welcome, {{name}}! Here's what's next", body_template: "Hi {{name}},\n\nThanks for reaching out! We'd love to help you get started.\n\nFeel free to reply to this email with any questions.\n\nBest,\nThe Team" },
    ],
  },
  {
    id: "lead-alert-webhook",
    icon: <Bell className="h-5 w-5 text-blue-400" />,
    name: "New Lead Alert",
    description: "When a lead is captured → instantly POST to your CRM or Slack",
    trigger_action: "capture_lead",
    steps: [
      { type: "webhook", url: "" },
    ],
  },
  {
    id: "demo-confirmation",
    icon: <Calendar className="h-5 w-5 text-violet-400" />,
    name: "Demo Booking Confirmation",
    description: "When a demo is booked → send a confirmation email immediately",
    trigger_action: "book_demo",
    steps: [
      { type: "email", to_field: "visitor_email", subject: "Your demo is confirmed, {{name}}!", body_template: "Hi {{name}},\n\nYour demo has been booked successfully. We'll send you calendar details shortly.\n\nLooking forward to speaking with you!" },
    ],
  },
  {
    id: "human-handoff-alert",
    icon: <User className="h-5 w-5 text-amber-400" />,
    name: "Human Handoff Alert",
    description: "When the agent escalates to a human → instantly notify your team",
    trigger_action: "assign_human_agent",
    steps: [
      { type: "webhook", url: "" },
    ],
  },
];

const STATUS_CONFIG = {
  running:   { label: "Running",   cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20",     icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  paused:    { label: "Paused",    cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20",   icon: <Clock className="h-3 w-3" /> },
  completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed:    { label: "Failed",    cls: "bg-red-500/10 text-red-400 border border-red-500/20",         icon: <XCircle className="h-3 w-3" /> },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function defaultStep(type: StepType): WorkflowStep {
  switch (type) {
    case "webhook": return { type: "webhook", url: "" };
    case "email":   return { type: "email", to_field: "visitor_email", subject: "", body_template: "" };
    case "wait":    return { type: "wait", seconds: 3600 };
  }
}

// ─── Mini Pipeline Visualization ─────────────────────────────────────────────

function PipelineViz({ steps }: { steps: WorkflowStep[] }) {
  if (!steps.length) return <span className="text-xs text-slate-600 italic">No steps</span>;
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const cfg = STEP_CONFIG[step.type];
        return (
          <div key={i} className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center border border-border bg-background ${cfg.color}`}
              title={cfg.label + (step.type === "wait" ? ` (${(step as WaitStep).seconds}s)` : "")}>
              {cfg.icon}
            </div>
            {i < steps.length - 1 && (
              <div className="w-5 h-px bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step Card (inside builder) ───────────────────────────────────────────────

function StepCard({
  step, index, total,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  step: WorkflowStep;
  index: number;
  total: number;
  onChange: (s: WorkflowStep) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const cfg = STEP_CONFIG[step.type];

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors";
  const labelCls = "block text-xs text-slate-500 mb-1";

  function setField(field: string, value: any) {
    onChange({ ...step, [field]: value } as WorkflowStep);
  }

  function secondsToDisplay(s: number) {
    if (s % 86400 === 0) return { val: s / 86400, unit: "days" };
    if (s % 3600 === 0)  return { val: s / 3600,  unit: "hours" };
    if (s % 60 === 0)    return { val: s / 60,     unit: "minutes" };
    return { val: s, unit: "seconds" };
  }

  function displayToSeconds(val: number, unit: string) {
    const multipliers: Record<string, number> = { seconds: 1, minutes: 60, hours: 3600, days: 86400 };
    return val * (multipliers[unit] ?? 1);
  }

  const waitDisplay = step.type === "wait" ? secondsToDisplay(step.seconds) : null;

  return (
    <div className={`rounded-xl border border-border border-l-2 ${cfg.accent} p-4 transition-all`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 ${cfg.color} font-medium text-sm`}>
          {cfg.icon}
          <span>{cfg.label}</span>
          <span className="text-slate-600 font-normal text-xs">Step {index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={index === 0}
            className="p-1 rounded text-slate-600 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="p-1 rounded text-slate-600 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete}
            className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-colors ml-1">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Fields */}
      {step.type === "webhook" && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Endpoint URL <span className="text-red-400">*</span></label>
            <input className={inputCls} placeholder="https://hooks.zapier.com/..." value={step.url}
              onChange={e => setField("url", e.target.value)} />
            <p className="text-xs text-slate-600 mt-1">Tip: For Slack, paste your Slack Incoming Webhook URL here.</p>
          </div>
        </div>
      )}

      {step.type === "wait" && waitDisplay && (
        <div>
          <label className={labelCls}>Duration</label>
          <div className="flex gap-2">
            <input type="number" min={1} className={inputCls + " flex-1"}
              value={waitDisplay.val}
              onChange={e => setField("seconds", displayToSeconds(parseInt(e.target.value) || 1, waitDisplay.unit))} />
            <select className={inputCls + " flex-1"}
              value={waitDisplay.unit}
              onChange={e => setField("seconds", displayToSeconds(waitDisplay.val, e.target.value))}>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="seconds">Seconds</option>
            </select>
          </div>
        </div>
      )}

      {step.type === "email" && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Recipient</label>
            <select className={inputCls}
              value={(step as EmailStep).to_field === "visitor_email" ? "visitor" : "static"}
              onChange={e => {
                if (e.target.value === "visitor") onChange({ ...step, to_field: "visitor_email", to_static: undefined } as EmailStep);
                else onChange({ ...step, to_field: undefined, to_static: "" } as EmailStep);
              }}>
              <option value="visitor">Visitor's email (from conversation)</option>
              <option value="static">Static address</option>
            </select>
            {(step as EmailStep).to_static !== undefined && (
              <input className={inputCls + " mt-2"} placeholder="team@yourcompany.com"
                value={(step as EmailStep).to_static ?? ""}
                onChange={e => setField("to_static", e.target.value)} />
            )}
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <input className={inputCls} placeholder="{{name}}, here's what you need to know"
              value={(step as EmailStep).subject ?? ""}
              onChange={e => setField("subject", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Email Body</label>
            <textarea rows={4} className={inputCls + " resize-none"}
              placeholder={"Hi {{name}},\n\nThank you for reaching out..."}
              value={(step as EmailStep).body_template ?? ""}
              onChange={e => setField("body_template", e.target.value)} />
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Template Variable Chips ──────────────────────────────────────────────────

function TemplateVarChips() {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(v: string) {
    navigator.clipboard.writeText(v).catch(() => {});
    setCopied(v);
    setTimeout(() => setCopied(null), 1500);
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-600">Template vars:</span>
      {TEMPLATE_VARS.map(v => (
        <button key={v} onClick={() => copy(v)}
          className="flex items-center gap-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded transition-colors">
          {copied === v ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {v}
        </button>
      ))}
    </div>
  );
}

// ─── Add Step Dropdown ────────────────────────────────────────────────────────

function AddStepDropdown({ onAdd }: { onAdd: (type: StepType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const types: StepType[] = ["webhook", "email", "wait"];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/5 transition-all w-full justify-center">
        <Plus className="h-4 w-4" />
        Add Step
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[#0f0f18] border border-border rounded-xl shadow-2xl overflow-hidden z-10">
          {types.map(type => {
            const cfg = STEP_CONFIG[type];
            return (
              <button key={type} onClick={() => { onAdd(type); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors group">
                <span className={`${cfg.color} group-hover:scale-110 transition-transform`}>{cfg.icon}</span>
                <div>
                  <div className="text-sm text-white font-medium">{cfg.label}</div>
                  <div className="text-xs text-slate-500">{cfg.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Workflow Builder Modal ────────────────────────────────────────────────────

function WorkflowBuilderModal({
  assistantId,
  existing,
  template,
  onClose,
  onSaved,
}: {
  assistantId: string;
  existing: Workflow | null;
  template?: WorkflowTemplate | null;
  onClose: () => void;
  onSaved: (wf: Workflow) => void;
}) {
  const [name, setName] = useState(existing?.name ?? template?.name ?? "");
  const [triggerAction, setTriggerAction] = useState(existing?.trigger_action ?? template?.trigger_action ?? "capture_lead");
  const [steps, setSteps] = useState<WorkflowStep[]>(existing?.steps ?? template?.steps ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) { setError("Workflow name is required."); return; }
    if (!steps.length) { setError("Add at least one step."); return; }
    for (const s of steps) {
      if (s.type === "webhook" && !(s as WebhookStep).url) { setError("All webhook steps need a URL."); return; }
    }
    setSaving(true);
    setError(null);
    try {
      const url = existing
        ? `/api/assistants/${assistantId}/workflows/${existing.id}`
        : `/api/assistants/${assistantId}/workflows`;
      const method = existing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), trigger_action: triggerAction, steps }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      onSaved(data.workflow);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function updateStep(i: number, s: WorkflowStep) {
    setSteps(prev => prev.map((p, idx) => idx === i ? s : p));
  }
  function deleteStep(i: number) {
    setSteps(prev => prev.filter((_, idx) => idx !== i));
  }
  function moveStep(i: number, dir: -1 | 1) {
    setSteps(prev => {
      const arr = [...prev];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0a0a12] border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-violet-400" />
            </div>
            <h2 className="font-semibold text-white">{existing ? "Edit Workflow" : "Create Workflow"}</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Name + trigger */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Workflow Name <span className="text-red-400">*</span></label>
              <input
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                placeholder="Lead Follow-up Sequence"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Trigger Action <span className="text-red-400">*</span></label>
              <select
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
                value={triggerAction}
                onChange={e => setTriggerAction(e.target.value)}>
                {TRIGGER_ACTIONS.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Steps</h3>
              <span className="text-xs text-slate-500">{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
            </div>

            {steps.length === 0 && (
              <div className="text-center py-6 border border-dashed border-border rounded-xl mb-3">
                <GitBranch className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No steps yet — add one below</p>
              </div>
            )}

            <div className="space-y-3">
              {steps.map((step, i) => (
                <StepCard
                  key={i}
                  step={step}
                  index={i}
                  total={steps.length}
                  onChange={s => updateStep(i, s)}
                  onDelete={() => deleteStep(i)}
                  onMoveUp={() => moveStep(i, -1)}
                  onMoveDown={() => moveStep(i, 1)}
                />
              ))}
            </div>

            <div className="mt-3">
              <AddStepDropdown onAdd={type => setSteps(prev => [...prev, defaultStep(type)])} />
            </div>
          </div>

          {/* Template vars */}
          <div className="pt-1">
            <TemplateVarChips />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
            {saving ? "Saving…" : (existing ? "Update Workflow" : "Save Workflow")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Workflow Card ────────────────────────────────────────────────────────────

function WorkflowCard({
  workflow,
  onEdit,
  onToggle,
  onDelete,
}: {
  workflow: Workflow;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 hover:border-violet-500/20 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
            <GitBranch className="h-4 w-4 text-violet-400" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-white text-sm truncate">{workflow.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                {TRIGGER_ACTIONS.find(a => a.value === workflow.trigger_action)?.label ?? workflow.trigger_action}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          {workflow.is_active
            ? <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Active</span>
            : <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800 border border-border px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-slate-600" />Inactive</span>
          }
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="mt-4 mb-3">
        <PipelineViz steps={workflow.steps} />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600">
          {workflow.run_count} run{workflow.run_count !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={onToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            {workflow.is_active ? <ToggleRight className="h-3.5 w-3.5 text-emerald-400" /> : <ToggleLeft className="h-3.5 w-3.5" />}
            {workflow.is_active ? "Disable" : "Enable"}
          </button>
          {confirming ? (
            <div className="flex items-center gap-1">
              <button onClick={onDelete}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-colors">
                Confirm
              </button>
              <button onClick={() => setConfirming(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-white rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Run History Section ──────────────────────────────────────────────────────

function RunHistory({ assistantId }: { assistantId: string }) {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/assistants/${assistantId}/workflow-runs`);
    const data = await res.json();
    setRuns(data.runs ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [assistantId]);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div>
          <h3 className="text-sm font-medium text-white">Recent Runs</h3>
          <p className="text-xs text-slate-500 mt-0.5">Last 30 workflow executions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); load(); }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No workflow runs yet. Trigger an agent action to start one.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {runs.map(run => {
                const sc = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.failed;
                return (
                  <div key={run.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sc.cls}`}>
                        {sc.icon} {sc.label}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{run.workflow_name}</p>
                        <p className="text-xs text-slate-500">
                          {run.visitor_email ? `${run.visitor_email} · ` : ""}
                          Step {Math.min(run.current_step, run.total_steps)}/{run.total_steps}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">{timeAgo(run.started_at)}</p>
                      {run.status === "paused" && run.next_run_at && (
                        <p className="text-xs text-amber-500">resumes {timeAgo(run.next_run_at)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main WorkflowTab ─────────────────────────────────────────────────────────

export function WorkflowTab({ assistantId }: { assistantId: string }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [templatePreset, setTemplatePreset] = useState<WorkflowTemplate | null>(null);

  async function loadWorkflows() {
    setLoading(true);
    const res = await fetch(`/api/assistants/${assistantId}/workflows`);
    const data = await res.json();
    setWorkflows(data.workflows ?? []);
    setLoading(false);
  }

  useEffect(() => { loadWorkflows(); }, [assistantId]);

  function openCreate() { setEditing(null); setTemplatePreset(null); setBuilderOpen(true); }
  function openEdit(wf: Workflow) { setEditing(wf); setTemplatePreset(null); setBuilderOpen(true); }

  function handleSaved(wf: Workflow) {
    setWorkflows(prev => {
      const exists = prev.find(w => w.id === wf.id);
      return exists ? prev.map(w => w.id === wf.id ? wf : w) : [wf, ...prev];
    });
    setBuilderOpen(false);
  }

  async function handleToggle(wf: Workflow) {
    const res = await fetch(`/api/assistants/${assistantId}/workflows/${wf.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !wf.is_active }),
    });
    const data = await res.json();
    if (data.workflow) setWorkflows(prev => prev.map(w => w.id === wf.id ? data.workflow : w));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/assistants/${assistantId}/workflows/${id}`, { method: "DELETE" });
    setWorkflows(prev => prev.filter(w => w.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Automation Workflows</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Multi-step sequences that run automatically when your agent fires an action
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0">
            <Plus className="h-4 w-4" />
            New Workflow
          </button>
        </div>

        {/* How it works */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <Globe className="h-4 w-4 text-blue-400" />, title: "Agent captures a lead", desc: "Your AI detects intent and fires an action" },
            { icon: <GitBranch className="h-4 w-4 text-violet-400" />, title: "Workflow starts", desc: "Steps execute: CRM update, email, Slack, wait…" },
            { icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />, title: "All automated", desc: "Runs for hours or days — no human needed" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-background rounded-xl p-3 border border-border">
              <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
              <div>
                <p className="text-xs font-medium text-white">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Templates — always shown when no workflows exist yet */}
      {!loading && workflows.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-sm font-medium text-white mb-1">Start from a template</h3>
          <p className="text-xs text-slate-500 mb-4">Pick a pre-built workflow and fill in the blanks — no setup from scratch.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORKFLOW_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => {
                  setEditing(null);
                  // Pre-fill builder with template data via a special path
                  setTemplatePreset(tpl);
                  setBuilderOpen(true);
                }}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background hover:border-violet-500/30 hover:bg-violet-500/5 text-left transition-all group"
              >
                <div className="mt-0.5 flex-shrink-0">{tpl.icon}</div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{tpl.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Workflow list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : workflows.length > 0 && (
        <div className="space-y-3">
          {workflows.map(wf => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onEdit={() => openEdit(wf)}
              onToggle={() => handleToggle(wf)}
              onDelete={() => handleDelete(wf.id)}
            />
          ))}
        </div>
      )}

      {/* Run history */}
      <RunHistory assistantId={assistantId} />

      {/* Builder modal */}
      {builderOpen && (
        <WorkflowBuilderModal
          assistantId={assistantId}
          existing={editing}
          template={templatePreset}
          onClose={() => { setBuilderOpen(false); setTemplatePreset(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
