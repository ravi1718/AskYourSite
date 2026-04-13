"use client";

import { useState, useCallback } from "react";
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  key_prefix: string;
  label: string;
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
}

interface NewKeyResult {
  key: string;
  prefix: string;
  label: string;
}

export function ApiKeysSection({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState("");

  const copyKey = useCallback(() => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.key).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [newKey]);

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: labelInput || "Default Key" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to generate key");
    } else {
      setNewKey(data);
      setShowNewKey(true);
      setLabelInput("");
      // Refresh list
      const listRes = await fetch("/api/settings/api-keys");
      const listData = await listRes.json();
      if (listData.keys) setKeys(listData.keys);
    }
    setGenerating(false);
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? Any relay servers using it will stop working immediately.")) return;
    setRevoking(id);
    const res = await fetch(`/api/settings/api-keys?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys(prev => prev.filter(k => k.id !== id));
    }
    setRevoking(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface shadow-card p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          API Keys
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        API keys authenticate server-side requests to <code className="text-slate-300">/api/v1/chat</code> (Webhook Relay). Keys are prefixed <code className="text-slate-300">ask_live_</code>. The full key is shown only once — copy it immediately.
      </p>

      {/* New key revealed */}
      {newKey && (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-sm font-medium text-emerald-400">Key generated — copy it now. You won't see it again.</p>
          </div>
          <div className="relative">
            <div className={cn(
              "bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-slate-300 break-all pr-20 select-all",
              !showNewKey && "filter blur-sm"
            )}>
              {newKey.key}
            </div>
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                onClick={() => setShowNewKey(v => !v)}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface border border-border text-slate-400 hover:text-white transition-colors"
                title={showNewKey ? "Hide" : "Show"}
              >
                {showNewKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={copyKey}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface border border-border text-slate-400 hover:text-white transition-colors"
                title="Copy"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            I've copied it — dismiss
          </button>
        </div>
      )}

      {/* Generate new key */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={labelInput}
          onChange={e => setLabelInput(e.target.value)}
          placeholder='Label (e.g. "Production relay")'
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
          onKeyDown={e => e.key === "Enter" && handleGenerate()}
        />
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="gap-2 bg-primary text-white hover:bg-blue-500 shrink-0"
        >
          {generating
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            : <><Plus className="h-4 w-4" /> Generate Key</>
          }
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Keys list */}
      {keys.length === 0 ? (
        <p className="text-sm text-slate-600 text-center py-6">No API keys yet. Generate one above to use the Webhook Relay.</p>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <div
              key={k.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Key className="h-4 w-4 text-slate-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{k.label}</p>
                  <p className="text-xs text-slate-500 font-mono">{k.key_prefix}…</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">Created {formatDate(k.created_at)}</p>
                  {k.last_used_at && (
                    <p className="text-xs text-slate-600">Last used {formatDate(k.last_used_at)}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  disabled={revoking === k.id}
                  className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Revoke key"
                >
                  {revoking === k.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
