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
    functional: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notified in Slack when a lead is captured or a query goes unanswered.",
    logo: <SlackLogo size={36} />,
    accentColor: "#E01E5A",
    provider: "slack",
    functional: true,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync your Notion pages as training sources — always up to date.",
    logo: <NotionLogo size={36} />,
    accentColor: "#ffffff",
    provider: "notion",
    functional: true,
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
      ) : onConfigure ? (
        <button
          onClick={onConfigure}
          className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white text-center transition-colors"
          style={{ backgroundColor: integration.accentColor }}
        >
          Connect {integration.name}
        </button>
      ) : (
        <a
          href={`/api/integrations/${integration.provider}/connect`}
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

// ─── Slack Config Panel ───────────────────────────────────────────────────────

function SlackAssistantConfig() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const [integration, setIntegration] = useState<{
    team_name: string;
    channel_name: string;
    alert_new_lead: boolean;
    alert_buying_intent: boolean;
    alert_unanswered: boolean;
    alert_booking_confirmed: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testState, setTestState] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const [toggles, setToggles] = useState({
    alert_new_lead: true,
    alert_buying_intent: true,
    alert_unanswered: true,
    alert_booking_confirmed: true,
  });
  const [assistants, setAssistants] = useState<{ id: string; name: string; slackEnabled: boolean }[]>([]);
  const [assistantSaving, setAssistantSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch plan, integration metadata, and assistants in parallel
      const [usageRes, integrationRes, assistantsRes] = await Promise.all([
        supabase.rpc("get_user_usage", { p_user_id: user.id } as any).single(),
        supabase.from("user_integrations").select("metadata").eq("user_id", user.id).eq("provider", "slack").single(),
        supabase.from("assistants").select("id, name, widget_config").eq("user_id", user.id).order("created_at"),
      ]);

      setPlan((usageRes.data as any)?.plan_code ?? "starter");

      if (integrationRes.data?.metadata) {
        const meta = integrationRes.data.metadata as Record<string, any>;
        setIntegration({
          team_name: meta.team_name ?? "",
          channel_name: meta.channel_name ?? "",
          alert_new_lead: meta.alert_new_lead ?? true,
          alert_buying_intent: meta.alert_buying_intent ?? true,
          alert_unanswered: meta.alert_unanswered ?? true,
          alert_booking_confirmed: meta.alert_booking_confirmed ?? true,
        });
        setToggles({
          alert_new_lead: meta.alert_new_lead ?? true,
          alert_buying_intent: meta.alert_buying_intent ?? true,
          alert_unanswered: meta.alert_unanswered ?? true,
          alert_booking_confirmed: meta.alert_booking_confirmed ?? true,
        });
      }

      setAssistants((assistantsRes.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        slackEnabled: r.widget_config?.slackEnabled !== false, // default true
      })));

      setLoading(false);
    })();
  }, []);

  async function handleAssistantToggle(assistantId: string) {
    const current = assistants.find((a) => a.id === assistantId);
    if (!current) return;
    const next = !current.slackEnabled;
    setAssistants((prev) => prev.map((a) => a.id === assistantId ? { ...a, slackEnabled: next } : a));
    setAssistantSaving((s) => ({ ...s, [assistantId]: true }));
    await fetch("/api/integrations/slack/assistant-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assistantId, slackEnabled: next }),
    });
    setAssistantSaving((s) => ({ ...s, [assistantId]: false }));
  }

  async function handleToggle(key: keyof typeof toggles) {
    const next = { ...toggles, [key]: !toggles[key] };
    setToggles(next);
    setSaving(true);
    await fetch("/api/integrations/slack/configure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
  }

  async function handleTestNotification() {
    setTestState("sending");
    const res = await fetch("/api/integrations/slack/test", { method: "POST" });
    const data = await res.json();
    setTestState(data.success ? "ok" : "fail");
    setTimeout(() => setTestState("idle"), 4000);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="h-5 w-48 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const isLocked = plan !== "pro" && plan !== "business";

  // Not connected state
  if (!integration) {
    return (
      <div className="rounded-2xl border border-[#E01E5A]/20 bg-[#E01E5A]/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <SlackLogo size={24} />
          <h2 className="text-base font-semibold text-white">Connect Slack</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Get instant Slack notifications when a visitor captures their email, asks about pricing, or your bot can&apos;t answer a question.
        </p>
        <ul className="space-y-1 mb-5">
          {["New lead captured → notification in Slack", "Buying intent detected → alert your sales team instantly", "Bot can't answer → reminder to update your training"].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-emerald-400">✓</span> {item}
            </li>
          ))}
        </ul>
        {isLocked ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Slack Alerts are available on the <strong>Pro plan</strong>. Upgrade to get real-time notifications when visitors show buying intent or your bot gets stuck.
          </div>
        ) : (
          <a
            href="/api/integrations/slack/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-[#E01E5A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c01849] transition-colors"
          >
            <SlackLogo size={16} /> Connect Slack
          </a>
        )}
      </div>
    );
  }

  // Connected state
  return (
    <div className="rounded-2xl border border-[#E01E5A]/20 bg-[#E01E5A]/5 p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <SlackLogo size={24} />
          <h2 className="text-base font-semibold text-white">Slack Alerts</h2>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Connected to {integration.team_name || "Slack"}
        </span>
      </div>

      <p className="text-sm text-slate-400 mb-2">
        Posting to <span className="text-white font-medium">#{integration.channel_name || "your channel"}</span>.
        <span className="text-slate-500 ml-1 text-xs">To change channel, disconnect and reconnect Slack.</span>
      </p>

      {isLocked && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
          🔒 Upgrade to Pro to enable Slack alerts
        </div>
      )}

      {/* Per-assistant toggles */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Assistants</p>
        {assistants.length === 0 ? (
          <p className="text-sm text-slate-500">No assistants yet. <a href="/dashboard/assistants/new" className="text-primary underline">Create one first.</a></p>
        ) : (
          <div className="space-y-2">
            {assistants.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="text-sm font-medium text-white">{a.name}</span>
                <button
                  onClick={() => !isLocked && handleAssistantToggle(a.id)}
                  disabled={isLocked || assistantSaving[a.id]}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${a.slackEnabled && !isLocked ? "bg-[#E01E5A]" : "bg-slate-700"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${a.slackEnabled ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert type toggles */}
      <div className="space-y-3 mb-5">
        {([
          { key: "alert_new_lead", label: "New lead captured", description: "When a visitor submits their email" },
          { key: "alert_buying_intent", label: "Buying intent detected", description: "When a visitor asks about pricing or plans" },
          { key: "alert_unanswered", label: "Bot can't answer", description: "When the bot fails to answer a question" },
          { key: "alert_booking_confirmed", label: "Booking confirmed", description: "When a visitor books a meeting via Calendly" },
        ] as Array<{ key: keyof typeof toggles; label: string; description: string }>).map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
            <button
              onClick={() => !isLocked && handleToggle(key)}
              disabled={isLocked || saving}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${toggles[key] && !isLocked ? "bg-[#E01E5A]" : "bg-slate-700"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${toggles[key] ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleTestNotification}
          disabled={isLocked || testState === "sending"}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {testState === "sending" ? "Sending…" : testState === "ok" ? "✓ Sent!" : testState === "fail" ? "Failed — try reconnecting" : "Send test notification"}
        </button>
      </div>
    </div>
  );
}

// ─── Zapier Config Panel ──────────────────────────────────────────────────────

function ZapierAssistantConfig() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<{ id: string; label: string; key_prefix: string; created_at: string; last_used_at: string | null }[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [assistants, setAssistants] = useState<{ id: string; name: string; zapierEnabled: boolean }[]>([]);
  const [assistantSaving, setAssistantSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [usageRes, keysRes, assRes] = await Promise.all([
        supabase.rpc("get_user_usage", { p_user_id: user.id } as any).single(),
        fetch("/api/keys"),
        supabase.from("assistants").select("id, name, widget_config").eq("user_id", user.id).order("created_at"),
      ]);
      setPlan((usageRes.data as any)?.plan_code ?? "starter");
      if (keysRes.ok) {
        const { keys } = await keysRes.json();
        setApiKeys(keys ?? []);
      }
      setAssistants((assRes.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        zapierEnabled: r.widget_config?.zapierEnabled === true,
      })));
      setLoading(false);
    })();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newKeyLabel || "Default Key" }),
    });
    const data = await res.json();
    if (data.key) {
      setRevealedKey(data.key);
      setApiKeys((prev) => [{ id: data.id, label: data.label, key_prefix: data.key_prefix, created_at: data.created_at, last_used_at: null }, ...prev]);
      setNewKeyLabel("");
    }
    setGenerating(false);
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    setRevoking(null);
  }

  async function handleAssistantToggle(assistantId: string) {
    const current = assistants.find((a) => a.id === assistantId);
    if (!current) return;
    const next = !current.zapierEnabled;
    setAssistants((prev) => prev.map((a) => a.id === assistantId ? { ...a, zapierEnabled: next } : a));
    setAssistantSaving((s) => ({ ...s, [assistantId]: true }));
    await fetch("/api/integrations/zapier/assistant-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assistantId, zapierEnabled: next }),
    });
    setAssistantSaving((s) => ({ ...s, [assistantId]: false }));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="h-5 w-48 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  const isLocked = plan !== "pro" && plan !== "business";

  return (
    <div className="rounded-2xl border border-[#FF4A00]/20 bg-[#FF4A00]/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <ZapierLogo size={24} />
        <h2 className="text-base font-semibold text-white">Zapier Integration</h2>
      </div>

      {isLocked && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
          🔒 Zapier integration requires a <strong>Pro plan</strong>.
        </div>
      )}

      {/* Revealed key banner */}
      {revealedKey && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-xs font-semibold text-emerald-400 mb-1">⚠ Save this key now — it won&apos;t be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-white bg-black/30 rounded px-3 py-2 font-mono break-all">{revealedKey}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(revealedKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="shrink-0 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setRevealedKey(null)} className="mt-2 text-xs text-slate-500 hover:text-slate-400">Dismiss</button>
        </div>
      )}

      {/* API Keys */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">API Keys</p>
        {apiKeys.length === 0 ? (
          <p className="text-sm text-slate-500 mb-3">No API keys yet. Generate one to connect Zapier.</p>
        ) : (
          <div className="space-y-2 mb-3">
            {apiKeys.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{k.label}</p>
                  <p className="text-xs text-slate-500 font-mono">{k.key_prefix}•••••••••••••••••••••••••</p>
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  disabled={revoking === k.id}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {revoking === k.id ? "Revoking…" : "Revoke"}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Key label (e.g. Production)"
            value={newKeyLabel}
            onChange={(e) => setNewKeyLabel(e.target.value)}
            disabled={isLocked}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder-slate-600 disabled:opacity-40"
          />
          <button
            onClick={handleGenerate}
            disabled={isLocked || generating}
            className="shrink-0 rounded-lg bg-[#FF4A00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e03e00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? "Generating…" : "Generate Key"}
          </button>
        </div>
      </div>

      {/* Per-assistant toggles */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Assistants (send to Zapier)</p>
        {assistants.length === 0 ? (
          <p className="text-sm text-slate-500">No assistants yet. <a href="/dashboard/assistants/new" className="text-primary underline">Create one first.</a></p>
        ) : (
          <div className="space-y-2">
            {assistants.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="text-sm font-medium text-white">{a.name}</span>
                <button
                  onClick={() => !isLocked && handleAssistantToggle(a.id)}
                  disabled={isLocked || assistantSaving[a.id]}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${a.zapierEnabled && !isLocked ? "bg-[#FF4A00]" : "bg-slate-700"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${a.zapierEnabled ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zap template links */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Pre-built Zap Templates</p>
        <div className="space-y-1.5">
          {[
            "New Lead → Add row to Google Sheets",
            "New Lead → Create contact in HubSpot",
            "Unanswered Question → Send Slack message",
            "Booking Confirmed → Add event to Google Calendar",
            "New Conversation → Send email via Gmail",
          ].map((t) => (
            <div key={t} className="flex items-center gap-2 text-sm text-slate-400">
              <span className="text-[#FF4A00]">⚡</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Notion Config Panel ──────────────────────────────────────────────────────

function NotionAssistantConfig() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const [integration, setIntegration] = useState<{ workspace_name: string } | null>(null);
  const [pages, setPages] = useState<{ id: string; title: string }[]>([]);
  const [databases, setDatabases] = useState<{ id: string; title: string }[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [assistants, setAssistants] = useState<{
    id: string; name: string; notionEnabled: boolean;
    selectedPages: string[]; selectedDatabases: string[];
    lastSyncedAt: string | null; syncStatus: string;
  }[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [usageRes, integrationRes, assRes, syncRes] = await Promise.all([
        supabase.rpc("get_user_usage", { p_user_id: user.id } as any).single(),
        supabase.from("user_integrations").select("metadata").eq("user_id", user.id).eq("provider", "notion").single(),
        supabase.from("assistants").select("id, name, widget_config").eq("user_id", user.id).order("created_at"),
        supabase.from("notion_sync_configs").select("bot_id, selected_pages, selected_databases, last_synced_at, status").eq("user_id", user.id),
      ]);

      setPlan((usageRes.data as any)?.plan_code ?? "starter");

      if (integrationRes.data?.metadata) {
        const meta = integrationRes.data.metadata as Record<string, any>;
        setIntegration({ workspace_name: meta.workspace_name ?? "" });

        // Fetch pages after confirming connected
        setPagesLoading(true);
        fetch("/api/integrations/notion/pages")
          .then((r) => r.json())
          .then((d) => { setPages(d.pages ?? []); setDatabases(d.databases ?? []); })
          .finally(() => setPagesLoading(false));
      }

      const syncMap = Object.fromEntries(
        (syncRes.data ?? []).map((s: any) => [s.bot_id, s])
      );

      setAssistants((assRes.data ?? []).map((r: any) => {
        const sync = syncMap[r.id];
        return {
          id: r.id,
          name: r.name,
          notionEnabled: r.widget_config?.notionEnabled === true,
          selectedPages: sync?.selected_pages?.map((p: any) => p.id) ?? [],
          selectedDatabases: sync?.selected_databases?.map((d: any) => d.id) ?? [],
          lastSyncedAt: sync?.last_synced_at ?? null,
          syncStatus: sync?.status ?? "not_configured",
        };
      }));

      setLoading(false);
    })();
  }, []);

  async function handleSaveConfig(assistantId: string) {
    const a = assistants.find((x) => x.id === assistantId);
    if (!a) return;
    setSaving((s) => ({ ...s, [assistantId]: true }));
    const selPages = pages.filter((p) => a.selectedPages.includes(p.id)).map((p) => ({ id: p.id, title: p.title }));
    const selDBs = databases.filter((d) => a.selectedDatabases.includes(d.id)).map((d) => ({ id: d.id, title: d.title }));
    await fetch("/api/integrations/notion/sync-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: assistantId, selectedPages: selPages, selectedDatabases: selDBs, notionEnabled: a.notionEnabled }),
    });
    setSaving((s) => ({ ...s, [assistantId]: false }));
  }

  async function handleSyncNow(assistantId: string) {
    setSyncing((s) => ({ ...s, [assistantId]: true }));
    await fetch("/api/integrations/notion/sync-now", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: assistantId }),
    });
    setSyncing((s) => ({ ...s, [assistantId]: false }));
    setAssistants((prev) => prev.map((a) => a.id === assistantId ? { ...a, lastSyncedAt: new Date().toISOString(), syncStatus: "active" } : a));
  }

  function togglePage(assistantId: string, pageId: string) {
    setAssistants((prev) => prev.map((a) => {
      if (a.id !== assistantId) return a;
      const has = a.selectedPages.includes(pageId);
      return { ...a, selectedPages: has ? a.selectedPages.filter((p) => p !== pageId) : [...a.selectedPages, pageId] };
    }));
  }

  function toggleDatabase(assistantId: string, dbId: string) {
    setAssistants((prev) => prev.map((a) => {
      if (a.id !== assistantId) return a;
      const has = a.selectedDatabases.includes(dbId);
      return { ...a, selectedDatabases: has ? a.selectedDatabases.filter((d) => d !== dbId) : [...a.selectedDatabases, dbId] };
    }));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="h-5 w-48 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  const isLocked = plan !== "pro" && plan !== "business";

  if (!integration) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <NotionLogo size={24} />
          <h2 className="text-base font-semibold text-white">Connect Notion</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Sync Notion pages and databases as training sources. Your bot learns from your documentation automatically.
        </p>
        {isLocked ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Notion sync is available on the <strong>Pro plan</strong>.
          </div>
        ) : (
          <a
            href="/api/integrations/notion/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-slate-100 transition-colors"
          >
            <NotionLogo size={16} /> Connect Notion
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <NotionLogo size={24} />
          <h2 className="text-base font-semibold text-white">Notion Sync</h2>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {integration.workspace_name || "Connected"}
        </span>
      </div>

      {isLocked && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
          🔒 Upgrade to Pro to enable Notion sync
        </div>
      )}

      {assistants.length === 0 ? (
        <p className="text-sm text-slate-500">No assistants yet. <a href="/dashboard/assistants/new" className="text-primary underline">Create one first.</a></p>
      ) : (
        <div className="space-y-4">
          {assistants.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">{a.name}</span>
                <div className="flex items-center gap-3">
                  {a.lastSyncedAt && (
                    <span className="text-xs text-slate-500">
                      Last synced: {new Date(a.lastSyncedAt).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold uppercase tracking-widest ${a.syncStatus === "active" ? "text-emerald-400" : a.syncStatus === "error" ? "text-red-400" : "text-slate-500"}`}>
                    {a.syncStatus === "active" ? "● Synced" : a.syncStatus === "error" ? "● Error" : "○ Not configured"}
                  </span>
                </div>
              </div>

              {/* Pages */}
              {pagesLoading ? (
                <div className="h-8 bg-white/5 rounded animate-pulse mb-2" />
              ) : pages.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-slate-500 mb-1.5">Pages</p>
                  <div className="flex flex-wrap gap-2">
                    {pages.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => !isLocked && togglePage(a.id, p.id)}
                        disabled={isLocked}
                        className={`rounded-lg border px-3 py-1 text-xs transition-colors disabled:opacity-40 ${a.selectedPages.includes(p.id) ? "border-white/30 bg-white/20 text-white" : "border-border text-slate-500 hover:border-white/20 hover:text-slate-300"}`}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Databases */}
              {databases.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1.5">Databases</p>
                  <div className="flex flex-wrap gap-2">
                    {databases.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => !isLocked && toggleDatabase(a.id, d.id)}
                        disabled={isLocked}
                        className={`rounded-lg border px-3 py-1 text-xs transition-colors disabled:opacity-40 ${a.selectedDatabases.includes(d.id) ? "border-white/30 bg-white/20 text-white" : "border-border text-slate-500 hover:border-white/20 hover:text-slate-300"}`}
                      >
                        {d.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => !isLocked && handleSaveConfig(a.id)}
                  disabled={isLocked || saving[a.id]}
                  className="rounded-lg bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors disabled:opacity-40"
                >
                  {saving[a.id] ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => !isLocked && handleSyncNow(a.id)}
                  disabled={isLocked || syncing[a.id] || a.syncStatus === "not_configured"}
                  className="rounded-lg border border-white/10 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                  {syncing[a.id] ? "Syncing…" : "Sync Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [openConfig, setOpenConfig] = useState<string | null>(null);

  async function loadConnected() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [intRes, keysRes] = await Promise.all([
      supabase.from("user_integrations").select("provider").eq("user_id", user.id),
      fetch("/api/keys"),
    ]);
    setConnectedProviders(new Set((intRes.data ?? []).map((r: { provider: string }) => r.provider)));
    if (keysRes.ok) {
      const { keys } = await keysRes.json();
      setHasApiKey((keys ?? []).length > 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadConnected();

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const successMessages: Record<string, string> = {
      calendly: "Calendly connected successfully!",
      slack: "Slack connected successfully! Alerts are now enabled.",
      notion: "Notion connected successfully! Select pages to sync.",
    };
    if (success && successMessages[success]) {
      setToast({ type: "success", message: successMessages[success] });
      window.history.replaceState({}, "", "/dashboard/integrations");
    } else if (params.get("error")) {
      const errMap: Record<string, string> = {
        no_code: "No authorization code received.",
        token_exchange: "Failed to exchange code for tokens. Please try again.",
        invalid_state: "Authorization request expired or invalid. Please try again.",
        access_denied: "Authorization was denied.",
        upgrade_required: "This integration requires a Pro or Business plan.",
        server_error: "A server error occurred. Please try again.",
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
            // Zapier "connected" = has an API key (not stored in user_integrations)
            const isConnected = integration.id === "zapier"
              ? hasApiKey
              : connectedProviders.has(integration.provider);

            // Show configure panel for these integrations regardless of connection state
            // (each panel handles its own not-connected state internally)
            const canConfigure =
              (integration.id === "calendly" && isConnected) ||
              integration.id === "slack" ||
              integration.id === "zapier" ||
              integration.id === "notion";

            const items: React.ReactNode[] = [
              <IntegrationCard
                key={integration.id}
                integration={integration}
                isConnected={isConnected}
                onDisconnected={loadConnected}
                onConfigure={canConfigure
                  ? () => setOpenConfig(openConfig === integration.id ? null : integration.id)
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
            if (integration.id === "slack" && openConfig === "slack") {
              items.push(
                <div key="slack-config" className="col-span-full">
                  <SlackAssistantConfig />
                </div>
              );
            }
            if (integration.id === "zapier" && openConfig === "zapier") {
              items.push(
                <div key="zapier-config" className="col-span-full">
                  <ZapierAssistantConfig />
                </div>
              );
            }
            if (integration.id === "notion" && openConfig === "notion") {
              items.push(
                <div key="notion-config" className="col-span-full">
                  <NotionAssistantConfig />
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
