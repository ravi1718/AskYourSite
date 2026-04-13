"use client";

import { useState } from "react";
import { X, RefreshCw, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTION_OPTIONS = [
  { value: "capture_lead",          label: "capture_lead",          desc: "User shows buying or contact intent" },
  { value: "book_demo",             label: "book_demo",             desc: "User requests a meeting or demo" },
  { value: "recommend_product",     label: "recommend_product",     desc: "AI suggests a specific product" },
  { value: "trigger_discount",      label: "trigger_discount",      desc: "User hesitates on price" },
  { value: "send_notification",     label: "send_notification",     desc: "Any notable conversation event" },
  { value: "assign_human_agent",    label: "assign_human_agent",    desc: "User is frustrated or stuck" },
  { value: "update_crm",            label: "update_crm",            desc: "Update contact record in your CRM" },
  { value: "track_event",           label: "track_event",           desc: "Analytics or conversion tracking" },
  { value: "personalize_experience",label: "personalize_experience",desc: "Return personalization data" },
];

export function WebhookModal({
  assistantId,
  onClose,
  onCreated,
}: {
  assistantId: string;
  onClose: () => void;
  onCreated: (webhook: any) => void;
}) {
  const [action, setAction] = useState("capture_lead");
  const [name, setName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function generateSecret() {
    const res = await fetch(`/api/assistants/${assistantId}/webhooks`, { method: "OPTIONS" });
    const data = await res.json();
    setSecretKey(data.secret || "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !endpointUrl.trim()) {
      setError("Name and endpoint URL are required.");
      return;
    }
    try {
      new URL(endpointUrl);
    } catch {
      setError("Please enter a valid URL (must start with https://).");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/assistants/${assistantId}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, name, endpoint_url: endpointUrl, secret_key: secretKey || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save webhook");
      onCreated(data.webhook);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedAction = ACTION_OPTIONS.find(a => a.value === action);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0f0f1a] border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-semibold text-white">Add Outbound Webhook</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Action Trigger</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              {ACTION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {selectedAction && (
              <p className="text-xs text-slate-500 mt-1.5">{selectedAction.desc}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Webhook Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Notify Sales Team on Lead"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Endpoint URL</label>
            <input
              type="url"
              value={endpointUrl}
              onChange={e => setEndpointUrl(e.target.value)}
              placeholder="https://yoursite.com/webhook/ays"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Secret Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-300">Signing Secret <span className="text-slate-600 font-normal">(optional)</span></label>
              <button
                type="button"
                onClick={generateSecret}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Generate
              </button>
            </div>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={secretKey}
                onChange={e => setSecretKey(e.target.value)}
                placeholder="whsec_..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              Used to sign requests with <code className="text-slate-500">X-AYS-Signature: sha256=...</code> so you can verify the call came from AskYourSite.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Webhook
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
