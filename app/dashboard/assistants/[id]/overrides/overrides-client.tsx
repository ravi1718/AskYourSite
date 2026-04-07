"use client";

import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, ShieldCheck, Loader2 } from "lucide-react";

interface Override {
  id: string;
  trigger_phrase: string;
  override_response: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  assistantId: string;
  initialOverrides: Override[];
}

export default function OverridesClient({ assistantId, initialOverrides }: Props) {
  const [overrides, setOverrides] = useState<Override[]>(initialOverrides);
  const [trigger, setTrigger] = useState("");
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!trigger.trim() || !response.trim()) {
      setError("Both trigger phrase and response are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/assistants/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantId,
          triggerPhrase: trigger.trim(),
          overrideResponse: response.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save rule.");
        return;
      }
      setOverrides((prev) => [json.override, ...prev]);
      setTrigger("");
      setResponse("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/assistants/overrides?id=${id}`, { method: "DELETE" });
      setOverrides((prev) => prev.filter((o) => o.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    setToggling(id);
    try {
      const res = await fetch(`/api/assistants/overrides?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setOverrides((prev) =>
          prev.map((o) => (o.id === id ? { ...o, is_active: !current } : o))
        );
      }
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add new rule */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card space-y-4">
        <h2 className="text-sm font-semibold text-white">Add Response Rule</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Trigger phrase
              <span className="ml-1 text-slate-600 font-normal">(case-insensitive, substring match)</span>
            </label>
            <input
              type="text"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder='e.g. "refund policy"'
              className="w-full rounded-xl bg-white/5 border border-border px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Exact response</label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder='e.g. "We offer a 30-day no-questions-asked refund. Email support@example.com to request it."'
              rows={3}
              className="w-full rounded-xl bg-white/5 border border-border px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Rule
          </button>
        </div>
      </div>

      {/* Existing rules */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
        {overrides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <ShieldCheck className="h-10 w-10 text-slate-600 mb-4" />
            <p className="text-base font-medium text-slate-400">No response rules yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Add a rule above to guarantee an exact answer for specific questions like
              "refund policy", "pricing", or "contact info".
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/4">
                  Trigger phrase
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Response
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20 text-center">
                  Active
                </th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {overrides.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b border-border/50 hover:bg-white/5 transition-colors last:border-b-0"
                >
                  <td className="px-4 py-3 align-top">
                    <span className="inline-block bg-white/10 text-slate-300 rounded-lg px-2 py-0.5 text-xs font-mono">
                      {rule.trigger_phrase}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 align-top">
                    <p className="leading-relaxed line-clamp-3">{rule.override_response}</p>
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    <button
                      onClick={() => handleToggle(rule.id, rule.is_active)}
                      disabled={toggling === rule.id}
                      title={rule.is_active ? "Disable rule" : "Enable rule"}
                      className="inline-flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      {toggling === rule.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                      ) : rule.is_active ? (
                        <ToggleRight className="h-6 w-6 text-primary" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-600" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right align-middle">
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={deleting === rule.id}
                      title="Delete rule"
                      className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                    >
                      {deleting === rule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
