"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ─── Inline SVG Logos ────────────────────────────────────────────────────────

function CalendlyLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#006BFF" />
      <path
        d="M22.4 16c0 3.535-2.865 6.4-6.4 6.4-3.535 0-6.4-2.865-6.4-6.4 0-3.535 2.865-6.4 6.4-6.4 1.18 0 2.285.32 3.23.875l1.42-1.42A8.348 8.348 0 0 0 16 7.6 8.4 8.4 0 1 0 24.4 16c0-.63-.07-1.245-.2-1.835l-1.93 1.93c.085.295.13.6.13.905Z"
        fill="white"
      />
    </svg>
  );
}

function CalDotComLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#101010" />
      <rect x="7" y="10" width="18" height="15" rx="2" stroke="#10b981" strokeWidth="1.5" />
      <line x1="7" y1="14" x2="25" y2="14" stroke="#10b981" strokeWidth="1.5" />
      <line x1="11" y1="8" x2="11" y2="12" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="8" x2="21" y2="12" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="19" r="1.5" fill="#10b981" />
    </svg>
  );
}

function ZapierLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#101010" />
      <path d="M18 5L8 18h7l-1 9 11-14h-7l1-8z" fill="#FF4A00" />
    </svg>
  );
}

function SlackLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#101010" />
      <rect x="7" y="13" width="4" height="4" rx="1.2" fill="#2EB67D" />
      <rect x="7" y="18" width="4" height="3" rx="1.2" fill="#2EB67D" />
      <rect x="13" y="7" width="4" height="4" rx="1.2" fill="#36C5F0" />
      <rect x="18" y="7" width="3" height="4" rx="1.2" fill="#36C5F0" />
      <rect x="21" y="13" width="4" height="4" rx="1.2" fill="#ECB22E" />
      <rect x="21" y="18" width="4" height="3" rx="1.2" fill="#ECB22E" />
      <rect x="13" y="21" width="4" height="4" rx="1.2" fill="#E01E5A" />
      <rect x="18" y="21" width="3" height="4" rx="1.2" fill="#E01E5A" />
    </svg>
  );
}

function NotionLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#101010" />
      <path d="M9 7h5l9 14V7h3v18h-5L12 11v14H9V7z" fill="white" />
    </svg>
  );
}

function GoogleDocsLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#101010" />
      <rect x="9" y="5" width="14" height="22" rx="1.5" fill="#4285F4" />
      <path d="M19 5v6h4" fill="none" stroke="#2a6fdb" strokeWidth="1" />
      <path d="M19 5l4 6" fill="#2a6fdb" />
      <rect x="12" y="14" width="8" height="1.5" rx="0.75" fill="white" fillOpacity="0.8" />
      <rect x="12" y="17" width="8" height="1.5" rx="0.75" fill="white" fillOpacity="0.8" />
      <rect x="12" y="20" width="5" height="1.5" rx="0.75" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

function GoogleSheetsLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#101010" />
      <rect x="9" y="5" width="14" height="22" rx="1.5" fill="#34A853" />
      <path d="M19 5l4 6" fill="#2d9249" />
      <line x1="9" y1="14" x2="23" y2="14" stroke="white" strokeOpacity="0.4" strokeWidth="1" />
      <line x1="9" y1="18" x2="23" y2="18" stroke="white" strokeOpacity="0.4" strokeWidth="1" />
      <line x1="16" y1="5" x2="16" y2="27" stroke="white" strokeOpacity="0.4" strokeWidth="1" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  accentColor: string;
  provider: string;
  functional: boolean;
}

interface EventType {
  uri: string;
  name: string;
  scheduling_url: string;
  duration: number;
}

interface Assistant {
  id: string;
  name: string;
  widget_config: Record<string, any> | null;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "calendly",
    name: "Calendly",
    description: "Let visitors book meetings directly from the chat — no back-and-forth.",
    logo: <CalendlyLogo size={36} />,
    accentColor: "#006BFF",
    provider: "calendly",
    functional: true,
  },
  {
    id: "cal_com",
    name: "Cal.com",
    description: "Open-source scheduling that connects to your AI assistant.",
    logo: <CalDotComLogo size={36} />,
    accentColor: "#10b981",
    provider: "cal_com",
    functional: false,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Trigger 6,000+ automations when a visitor interacts with your assistant.",
    logo: <ZapierLogo size={36} />,
    accentColor: "#FF4A00",
    provider: "zapier",
    functional: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notified in Slack when a lead is captured or a query goes unanswered.",
    logo: <SlackLogo size={36} />,
    accentColor: "#E01E5A",
    provider: "slack",
    functional: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync your Notion pages as training sources — always up to date.",
    logo: <NotionLogo size={36} />,
    accentColor: "#ffffff",
    provider: "notion",
    functional: false,
  },
  {
    id: "google_docs",
    name: "Google Docs",
    description: "Train your assistant directly from Google Docs without manual uploads.",
    logo: <GoogleDocsLogo size={36} />,
    accentColor: "#4285F4",
    provider: "google_docs",
    functional: false,
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    description: "Use spreadsheet data as a knowledge source for your AI assistant.",
    logo: <GoogleSheetsLogo size={36} />,
    accentColor: "#34A853",
    provider: "google_sheets",
    functional: false,
  },
];

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  isConnected,
  onDisconnected,
  onConfigure,
}: {
  integration: Integration;
  isConnected: boolean;
  onDisconnected: () => void;
  onConfigure?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [disconnecting, setDisconnecting] = useState(false);
  const router = useRouter();

  async function handleDisconnect() {
    setDisconnecting(true);
    await fetch(`/api/integrations/${integration.provider}/disconnect`, { method: "POST" });
    setDisconnecting(false);
    onDisconnected();
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-4 transition-shadow hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{integration.logo}</div>
        <div>
          <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
          {integration.functional && isConnected && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-400 leading-relaxed flex-1">{integration.description}</p>

      {!integration.functional ? (
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
          style={{
            borderColor: `${integration.accentColor}40`,
            color: integration.accentColor,
            backgroundColor: `${integration.accentColor}12`,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: integration.accentColor }} />
          Coming Soon
        </span>
      ) : isConnected ? (
        <div className="flex flex-col gap-2">
          {onConfigure && (
            <button
              onClick={onConfigure}
              className="w-full rounded-lg border border-[#006BFF]/30 bg-[#006BFF]/10 px-4 py-2 text-sm font-medium text-[#5a9fff] hover:bg-[#006BFF]/20 transition-colors"
            >
              ⚙ Configure Assistants
            </button>
          )}
          <button
            onClick={handleDisconnect}
            disabled={disconnecting || isPending}
            className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {disconnecting || isPending ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      ) : (
        <a
          href="/api/integrations/calendly/connect"
          className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white text-center transition-colors"
          style={{ backgroundColor: integration.accentColor }}
        >
          Connect {integration.name}
        </a>
      )}
    </div>
  );
}

// ─── Calendly Assistant Config Panel ─────────────────────────────────────────

function CalendlyAssistantConfig() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});

  // Per-assistant local config state: { [assistantId]: { enabled, eventTypeUrl, eventTypeName } }
  const [configs, setConfigs] = useState<Record<string, { enabled: boolean; eventTypeUrl: string; eventTypeName: string }>>({});

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [etRes, assRes] = await Promise.all([
        fetch("/api/integrations/calendly/event-types"),
        supabase.from("assistants").select("id, name, widget_config").eq("user_id", user.id).order("created_at"),
      ]);

      if (etRes.ok) {
        const { eventTypes: et } = await etRes.json();
        setEventTypes(et ?? []);
      }

      const asses = (assRes.data ?? []) as Assistant[];
      setAssistants(asses);

      // Initialize local config from existing widget_config
      const initial: typeof configs = {};
      for (const a of asses) {
        const wc = a.widget_config ?? {};
        initial[a.id] = {
          enabled: Boolean(wc.calendlyEnabled),
          eventTypeUrl: wc.calendlyEventTypeUrl ?? "",
          eventTypeName: wc.calendlyEventTypeName ?? "",
        };
      }
      setConfigs(initial);
      setLoadingData(false);
    })();
  }, []);

  async function handleSave(assistantId: string) {
    const cfg = configs[assistantId];
    if (!cfg) return;
    setSaving((s) => ({ ...s, [assistantId]: true }));
    await fetch("/api/integrations/calendly/assistant-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assistantId,
        calendlyEnabled: cfg.enabled,
        calendlyEventTypeUrl: cfg.eventTypeUrl,
        calendlyEventTypeName: cfg.eventTypeName,
      }),
    });
    setSaving((s) => ({ ...s, [assistantId]: false }));
    setSavedStates((s) => ({ ...s, [assistantId]: true }));
    setTimeout(() => setSavedStates((s) => ({ ...s, [assistantId]: false })), 2000);
  }

  function updateConfig(assistantId: string, patch: Partial<typeof configs[string]>) {
    setConfigs((prev) => ({ ...prev, [assistantId]: { ...prev[assistantId], ...patch } }));
  }

  function handleEventTypeChange(assistantId: string, schedulingUrl: string) {
    const et = eventTypes.find((e) => e.scheduling_url === schedulingUrl);
    updateConfig(assistantId, {
      eventTypeUrl: schedulingUrl,
      eventTypeName: et?.name ?? "",
    });
  }

  if (loadingData) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="h-5 w-48 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#006BFF]/30 bg-[#006BFF]/5 p-6">
      <div className="flex items-center gap-3 mb-1">
        <CalendlyLogo size={24} />
        <h2 className="text-base font-semibold text-white">Calendly — Assistant Configuration</h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Choose which assistants can offer booking to visitors. When a visitor mentions scheduling a meeting, the bot will show a booking card.
        {" "}<span className="text-amber-400 font-medium">Requires Pro or Business plan to activate in the chat widget.</span>
      </p>

      {assistants.length === 0 ? (
        <p className="text-sm text-slate-500">You have no assistants yet. <a href="/dashboard/assistants/new" className="text-primary underline">Create one first.</a></p>
      ) : (
        <div className="space-y-3">
          {assistants.map((assistant) => {
            const cfg = configs[assistant.id] ?? { enabled: false, eventTypeUrl: "", eventTypeName: "" };
            const isSaving = saving[assistant.id];
            const isSaved = savedStates[assistant.id];

            return (
              <div key={assistant.id} className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Toggle */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => updateConfig(assistant.id, { enabled: !cfg.enabled })}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${cfg.enabled ? "bg-[#006BFF]" : "bg-slate-700"}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${cfg.enabled ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                  <span className="text-sm font-medium text-white truncate">{assistant.name}</span>
                </div>

                {/* Event type selector */}
                <select
                  value={cfg.eventTypeUrl}
                  onChange={(e) => handleEventTypeChange(assistant.id, e.target.value)}
                  disabled={!cfg.enabled || eventTypes.length === 0}
                  className="rounded-lg border border-border bg-background text-sm text-white px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed min-w-0 flex-1 max-w-xs"
                >
                  <option value="">— Select event type —</option>
                  {eventTypes.map((et) => (
                    <option key={et.uri} value={et.scheduling_url}>
                      {et.name} ({et.duration} min)
                    </option>
                  ))}
                </select>

                {/* Save button */}
                <button
                  onClick={() => handleSave(assistant.id)}
                  disabled={isSaving || (cfg.enabled && !cfg.eventTypeUrl)}
                  className="shrink-0 rounded-lg bg-[#006BFF] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#0057d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving…" : isSaved ? "Saved ✓" : "Save"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [openConfig, setOpenConfig] = useState<string | null>(null);

  async function loadConnected() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_integrations")
      .select("provider")
      .eq("user_id", user.id);
    setConnectedProviders(new Set((data ?? []).map((r: { provider: string }) => r.provider)));
    setLoading(false);
  }

  useEffect(() => {
    loadConnected();

    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "calendly") {
      setToast({ type: "success", message: "Calendly connected successfully!" });
      window.history.replaceState({}, "", "/dashboard/integrations");
    } else if (params.get("error")) {
      const errMap: Record<string, string> = {
        no_code: "No authorization code received from Calendly.",
        token_exchange: "Failed to exchange code for tokens. Please try again.",
      };
      setToast({ type: "error", message: errMap[params.get("error")!] ?? "Connection failed." });
      window.history.replaceState({}, "", "/dashboard/integrations");
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-xl border px-5 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-red-500/40 bg-red-500/10 text-red-400"}`}>
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="mt-1 text-sm text-slate-400">Connect your favorite tools to supercharge your AI assistant.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INTEGRATIONS.flatMap((integration) => {
            const isConnected = connectedProviders.has(integration.provider);
            const items: React.ReactNode[] = [
              <IntegrationCard
                key={integration.id}
                integration={integration}
                isConnected={isConnected}
                onDisconnected={loadConnected}
                onConfigure={integration.id === "calendly" && isConnected
                  ? () => setOpenConfig(openConfig === "calendly" ? null : "calendly")
                  : undefined}
              />,
            ];
            if (integration.id === "calendly" && openConfig === "calendly") {
              items.push(
                <div key="calendly-config" className="col-span-full">
                  <CalendlyAssistantConfig />
                </div>
              );
            }
            return items;
          })}
        </div>
      )}
    </div>
  );
}
