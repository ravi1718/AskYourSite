"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";

/* ─── Terminal animation component ─────────────────────────── */
function TerminalPanel() {
  const [lineIdx, setLineIdx] = useState(0);
  const lines = [
    { text: "$ scanning https://yoursite.com", color: "#888" },
    { text: "  ✓ /about              1,240 tokens", color: "#4ade80" },
    { text: "  ✓ /pricing              890 tokens", color: "#4ade80" },
    { text: "  ✓ /docs/getting-started  3,100 tokens", color: "#4ade80" },
    { text: "  ✓ /blog/update          2,400 tokens", color: "#4ade80" },
    { text: "  → Embedding 47 pages...", color: "#00D9FF" },
    { text: "  ✓ Training complete in 38s", color: "#4ade80" },
    { text: "", color: "" },
    { text: "  AI agent is ready.", color: "#00D9FF" },
  ];

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const t = setTimeout(() => setLineIdx((i) => i + 1), lineIdx === 0 ? 200 : 320);
    return () => clearTimeout(t);
  }, [lineIdx]);

  return (
    <div className="h-full rounded-2xl border border-[#1C1C1C] bg-[#050505] overflow-hidden font-mono">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1C1C1C]">
        <div className="h-2.5 w-2.5 rounded-full bg-[#1C1C1C]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#1C1C1C]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#1C1C1C]" />
        <span className="ml-2 text-[11px] text-[#444]">askyoursite — train</span>
      </div>
      <div className="p-4 space-y-1.5">
        {lines.slice(0, lineIdx).map((line, i) => (
          <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[12px] leading-relaxed" style={{ color: line.color || "#888" }}>
            {line.text}
          </motion.p>
        ))}
        {lineIdx < lines.length && (
          <span className="inline-block h-4 w-2 bg-[#00D9FF] animate-blink opacity-80" />
        )}
      </div>
    </div>
  );
}

/* ─── Agent Mode panel ───────────────────────────────────── */
function AgentPanel() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timings = [400, 1000, 2000, 3000, 4200];
    const ts = timings.map((t, i) => setTimeout(() => setPhase(i + 1), t));
    return () => ts.forEach(clearTimeout);
  }, []);

  const signals = [
    { label: "buying_intent", value: 0.94, color: "#00D9FF" },
    { label: "urgency",       value: 0.72, color: "#f59e0b" },
    { label: "frustration",   value: 0.21, color: "#f87171" },
  ];

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Message */}
      <div className="rounded-2xl border border-[#1C1C1C] bg-[#050505] p-4">
        <p className="text-[11px] text-[#555] mb-2.5">Visitor message</p>
        <div className="bg-[#0A0A0A] border border-[#1C1C1C] rounded-xl px-4 py-3 text-[13px] text-white leading-relaxed">
          "We need the enterprise plan urgently — we're launching next week"
        </div>
      </div>

      {/* Intent signals */}
      {phase >= 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#1C1C1C] bg-[#050505] p-4 flex-1">
          <p className="text-[11px] text-[#555] mb-3">Intent signals detected</p>
          <div className="space-y-3">
            {signals.map((s, i) => (
              i < phase && (
                <motion.div key={s.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-[#555] w-32 shrink-0">{s.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#1C1C1C] overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${s.value * 100}%` }}
                      transition={{ delay: i * 0.1 + 0.2, duration: 0.7, ease: "easeOut" }}
                      style={{ backgroundColor: s.color }} />
                  </div>
                  <span className="text-[11px] font-mono font-bold w-8 text-right" style={{ color: s.color }}>{s.value}</span>
                </motion.div>
              )
            ))}
          </div>

          {phase >= 4 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 pt-3 border-t border-[#1C1C1C] space-y-2">
              {[
                { icon: "⚡", label: "Webhook fired → Salesforce CRM" },
                { icon: "💬", label: "Slack alert → #sales channel" },
              ].map((a) => (
                <motion.div key={a.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-[12px] text-[#888]">
                  <span>{a.icon}</span><span>{a.label}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ─── Handoff panel ──────────────────────────────────────── */
function HandoffPanel() {
  const [status, setStatus] = useState<"waiting" | "active" | "resolved">("waiting");

  useEffect(() => {
    const t1 = setTimeout(() => setStatus("active"), 2000);
    const t2 = setTimeout(() => setStatus("resolved"), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Status timeline */}
      <div className="rounded-2xl border border-[#1C1C1C] bg-[#050505] p-4">
        <p className="text-[11px] text-[#555] mb-3">Handoff status</p>
        <div className="flex items-center gap-2">
          {(["waiting", "active", "resolved"] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium border transition-all duration-500 ${
                status === s
                  ? s === "waiting" ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : s === "active" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-[#1C1C1C] bg-[#0A0A0A] text-[#555]"
                  : "border-[#1C1C1C] text-[#333]"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  status === s
                    ? s === "waiting" ? "bg-amber-400 animate-pulse"
                    : s === "active" ? "bg-emerald-400 animate-pulse"
                    : "bg-[#555]"
                    : "bg-[#333]"
                }`} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-[#1C1C1C]" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Inbox card */}
      <div className="flex-1 rounded-2xl border border-[#1C1C1C] bg-[#050505] p-4">
        <p className="text-[11px] text-[#555] mb-3">Your inbox</p>
        <div className="rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] p-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[12px] font-semibold text-white">Sarah K.</p>
              <p className="text-[10px] text-[#555]">Trigger: explicit request · 2 min ago</p>
            </div>
            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
              status === "waiting" ? "text-amber-400 bg-amber-500/10" : status === "active" ? "text-emerald-400 bg-emerald-500/10" : "text-[#555] bg-[#1C1C1C]"
            }`}>
              {status.toUpperCase()}
            </span>
          </div>
          <div className="text-[11px] text-[#888] bg-[#050505] border border-[#1C1C1C] rounded-lg p-2.5 mb-3 leading-relaxed">
            "Visitor is urgently requesting enterprise support. AI could not find specific contract terms."
          </div>
          {status === "waiting" && (
            <div className="rounded-lg bg-white text-black text-[12px] font-semibold text-center py-1.5 cursor-pointer">
              Claim Conversation →
            </div>
          )}
          {status === "active" && (
            <div className="text-center text-[12px] text-emerald-400 font-medium">
              ✓ You are live with this visitor
            </div>
          )}
          {status === "resolved" && (
            <div className="text-center text-[12px] text-[#555]">
              Conversation resolved · AI resumed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Integrations hub panel ─────────────────────────────── */
function IntegrationsPanel() {
  const [active, setActive] = useState(-1);

  const integrations = [
    { name: "Notion", color: "#fff", icon: "N", angle: 0 },
    { name: "Slack", color: "#4a154b", icon: "S", angle: 60 },
    { name: "Google Docs", color: "#4285f4", icon: "G", angle: 120 },
    { name: "HubSpot", color: "#ff7a59", icon: "H", angle: 180 },
    { name: "Airtable", color: "#f94f35", icon: "A", angle: 240 },
    { name: "Zapier", color: "#ff4a00", icon: "Z", angle: 300 },
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setActive(i % integrations.length);
      i++;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const radius = 80;

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex-1 rounded-2xl border border-[#1C1C1C] bg-[#050505] flex items-center justify-center">
        <div className="relative w-[220px] h-[220px]">
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="h-16 w-16 rounded-2xl border border-[#1C1C1C] bg-[#0A0A0A] flex items-center justify-center">
              <span className="text-[11px] font-bold text-white text-center leading-tight">Ask<br/>YourSite</span>
            </div>
          </div>

          {/* Spokes */}
          {integrations.map((int, i) => {
            const rad = (int.angle * Math.PI) / 180;
            const x = 110 + radius * Math.cos(rad) - 18;
            const y = 110 + radius * Math.sin(rad) - 18;
            const isActive = active === i;

            return (
              <div key={int.name}>
                {/* Line */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                  <motion.line
                    x1={110} y1={110}
                    x2={x + 18} y2={y + 18}
                    stroke={isActive ? "#00D9FF" : "#1C1C1C"}
                    strokeWidth={isActive ? 1.5 : 1}
                    animate={{ stroke: isActive ? "#00D9FF" : "#1C1C1C" }}
                    transition={{ duration: 0.3 }}
                    strokeDasharray={isActive ? "4 4" : "0"}
                  />
                </svg>
                {/* Logo */}
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1, borderColor: isActive ? "#00D9FF" : "#1C1C1C" }}
                  transition={{ duration: 0.3 }}
                  className="absolute h-9 w-9 rounded-xl border bg-[#0A0A0A] flex items-center justify-center z-10"
                  style={{ left: x, top: y }}
                >
                  <span className="text-[12px] font-bold" style={{ color: isActive ? "#00D9FF" : "#555" }}>
                    {int.icon}
                  </span>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#1C1C1C] bg-[#050505] px-4 py-3 text-[12px] text-[#888]">
        <span className="text-white font-semibold">7 native integrations</span> + Zapier for 6,000+ tools.{" "}
        Data flows in. Actions fire out.
      </div>
    </div>
  );
}

/* ─── Triggers panel ─────────────────────────────────────── */
function TriggersPanel() {
  const [step, setStep] = useState(0);

  const events = [
    { label: "Visitor on /pricing for 45s", color: "#888" },
    { label: "Widget auto-opens →", color: "#00D9FF" },
    { label: '"Need help choosing a plan?"', color: "#fff" },
    { label: "Visitor replies: 'Yes!'", color: "#888" },
    { label: "Lead captured ✓", color: "#4ade80" },
  ];

  useEffect(() => {
    if (step >= events.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 600 : 1000);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex-1 rounded-2xl border border-[#1C1C1C] bg-[#050505] p-4">
        <p className="text-[11px] text-[#555] mb-4">Proactive trigger: time-on-page</p>
        <div className="space-y-3">
          {events.slice(0, step).map((ev, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3">
              <div className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
              <span className="text-[13px]" style={{ color: ev.color }}>{ev.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Time on page", value: "45s trigger" },
          { label: "Exit intent", value: "On cursor leave" },
          { label: "Return visit", value: "2nd+ visit" },
          { label: "URL match", value: "/pricing, /demo" },
        ].map((t) => (
          <div key={t.label} className="rounded-xl border border-[#1C1C1C] bg-[#050505] p-3">
            <p className="text-[10px] text-[#555] mb-0.5">{t.label}</p>
            <p className="text-[11px] font-semibold text-white">{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Steps config ──────────────────────────────────────── */
const STEPS = [
  {
    id: "knowledge",
    badge: "Knowledge Base",
    title: "Train on any source. Automatically.",
    desc: "Paste a URL, upload a PDF, or connect Notion, Google Docs, Airtable, or HubSpot. Your AI reads it all and stays updated every night.",
    bullets: ["Website crawling — up to 500 pages", "PDF, plain text, spreadsheets", "Notion, Google Docs, HubSpot, Airtable"],
    panel: <TerminalPanel />,
  },
  {
    id: "agent",
    badge: "Agent Mode",
    title: "Detects intent. Takes action. Autonomously.",
    desc: "The AI doesn't just answer questions — it classifies intent, triggers webhooks, alerts your sales team, and captures leads without a single button click.",
    bullets: ["5 intent signals: buying, urgency, frustration, unanswered, repetition", "Webhook triggers to any CRM or tool", "Slack alerts for high-value signals"],
    panel: <AgentPanel />,
  },
  {
    id: "handoff",
    badge: "Human Handoff",
    title: "When AI isn't enough, a human steps in.",
    desc: "Frustrated visitor? Explicit request for a human? The AI escalates automatically — no buttons on the visitor side. Your team gets a live inbox with full context.",
    bullets: ["Zero friction for the visitor", "Full conversation history + AI summary", "Claim, reply, resolve — in one view"],
    panel: <HandoffPanel />,
  },
  {
    id: "integrations",
    badge: "Integrations",
    title: "Plug into your entire stack.",
    desc: "Native connections to Notion, Google Docs, Airtable, HubSpot, Slack, Calendly. Plus Zapier for 6,000+ more. Data flows in, actions fire out.",
    bullets: ["7 native integrations", "Zapier: 6,000+ supported apps", "Webhooks to any endpoint"],
    panel: <IntegrationsPanel />,
  },
  {
    id: "triggers",
    badge: "Proactive Triggers",
    title: "Don't wait for visitors to ask.",
    desc: "Configure triggers that open the chat at the perfect moment: time on pricing page, exit intent, return visits, or specific URL patterns.",
    bullets: ["Time-on-page, exit intent, return visit", "URL pattern matching", "Custom opening message per trigger"],
    panel: <TriggersPanel />,
  },
];

/* ─── Main component ────────────────────────────────────── */
export function StickyFeatures() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = stepRefs.current.findIndex((r) => r === entry.target);
            if (idx !== -1) setActiveStep(idx);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    stepRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 bg-black border-b border-[#1C1C1C]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
            Platform
          </div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight">
            Everything the best support teams need.
          </h2>
        </div>

        <div className="flex gap-16" ref={containerRef}>
          {/* Left: sticky panel */}
          <div className="hidden lg:block w-1/2 sticky top-24 self-start h-[460px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {STEPS[activeStep].panel}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: scrollable steps */}
          <div className="flex-1 space-y-24">
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="min-h-[200px]"
              >
                {/* Mobile panel */}
                <div className="lg:hidden mb-6 h-80">
                  {step.panel}
                </div>

                <div className={`transition-opacity duration-300 ${activeStep === i ? "opacity-100" : "opacity-40"}`}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-3 py-1 text-[11px] font-medium text-[#888] mb-4">
                    {step.badge}
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[#888] text-base leading-relaxed mb-5">
                    {step.desc}
                  </p>
                  <ul className="space-y-2">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-[#888]">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
