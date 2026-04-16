"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Zap,
  Users,
  GitBranch,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";

const TABS = [
  { id: "chat", label: "Chat Widget", icon: MessageSquare },
  { id: "agent", label: "Agent Mode", icon: Zap },
  { id: "handoff", label: "Human Handoff", icon: Users },
  { id: "workflows", label: "Workflows", icon: GitBranch },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

/* ─── Tab 1: Chat Widget ──────────────────────────────────── */
function ChatWidgetDemo() {
  const [step, setStep] = useState(0);

  const conversation = [
    { role: "assistant", text: "Hi! I'm your AI support agent. How can I help you today?" },
    { role: "user", text: "What's your refund policy?" },
    { role: "assistant", text: "We offer a 30-day full refund on all plans, no questions asked. For annual plans, you'll receive a prorated refund. Would you like me to help you initiate one?" },
    { role: "user", text: "No thanks, what about enterprise pricing?" },
    { role: "assistant", text: "Our Business plan at $149/mo includes 10 agents and 5,000 conversations. For custom enterprise needs — dedicated infrastructure, SSO, SLA — I can connect you with our team." },
  ];

  useEffect(() => {
    if (step >= conversation.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 600 : 1400);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="flex h-full gap-4">
      {/* Chat panel */}
      <div className="flex-1 flex flex-col rounded-xl border border-[#1C1C1C] bg-[#050505] overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1C1C1C]">
          <div className="h-7 w-7 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center">
            <span className="text-[10px] text-[#00D9FF] font-bold">AI</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Support Agent</p>
            <p className="text-[10px] text-[#888] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Online
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {conversation.slice(0, step).map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-white rounded-tr-sm"
                  : "bg-[#111] border border-[#1C1C1C] text-[#ccc] rounded-tl-sm"
              }`}>{msg.text}</div>
            </motion.div>
          ))}
          {step > 0 && step < conversation.length && conversation[step - 1].role === "user" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="rounded-xl rounded-tl-sm border border-[#1C1C1C] bg-[#111] px-3 py-2.5">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#555] animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#555] animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#555] animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Suggestion chips */}
        {step >= 3 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="px-3 pb-2 flex gap-2">
            {["Book a demo", "View pricing"].map((c) => (
              <span key={c} className="text-[11px] px-2.5 py-1 rounded-full border border-[#1C1C1C] text-[#888] cursor-pointer hover:border-[#00D9FF]/40 hover:text-[#00D9FF] transition-colors">{c}</span>
            ))}
          </motion.div>
        )}

        <div className="border-t border-[#1C1C1C] px-3 py-2 flex gap-2">
          <div className="flex-1 text-[11px] text-[#333]">Type a message…</div>
          <div className="h-5 w-5 rounded-lg bg-[#00D9FF]/15 flex items-center justify-center">
            <ArrowRight className="h-3 w-3 text-[#00D9FF]" />
          </div>
        </div>
      </div>

      {/* Right: features */}
      <div className="w-44 flex flex-col gap-2">
        {[
          { label: "Instant answers", desc: "< 1s response time", color: "emerald" },
          { label: "Source retrieval", desc: "From your knowledge base", color: "cyan" },
          { label: "Suggestion chips", desc: "Guide conversations", color: "amber" },
          { label: "Lead capture", desc: "Auto-collect emails", color: "violet" },
        ].map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 + 0.3 }}
            className="rounded-xl border border-[#1C1C1C] bg-[#050505] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              <span className="text-[11px] font-semibold text-white">{f.label}</span>
            </div>
            <p className="text-[10px] text-[#555]">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab 2: Agent Mode ───────────────────────────────────── */
function AgentModeDemo() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timings = [800, 1600, 2600, 3600, 4800];
    const timeouts = timings.map((t, i) =>
      setTimeout(() => setPhase(i + 1), t)
    );
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const signals = [
    { label: "buying_intent", value: 0.94, color: "#00D9FF" },
    { label: "urgency", value: 0.72, color: "#f59e0b" },
    { label: "frustration", value: 0.21, color: "#f87171" },
  ];

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 flex flex-col gap-3">
        {/* Chat message with overlay */}
        <div className="relative rounded-xl border border-[#1C1C1C] bg-[#050505] p-4">
          <p className="text-[11px] text-[#888] mb-2">Incoming message</p>
          <div className="bg-[#111] border border-[#1C1C1C] rounded-xl px-3 py-2 text-[12px] text-white">
            "I need the enterprise plan ASAP — we're launching next week and need this integrated today"
          </div>

          {/* Floating signal badges */}
          {phase >= 1 && signals.map((s, i) => (
            i < phase && (
              <motion.div key={s.label} initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.2 }}
                className="absolute -top-3 right-4 flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-3 py-1 text-[10px] font-mono"
                style={{ top: `-${(i * 32) + 12}px` }}>
                <span className="text-[#555]">{s.label}</span>
                <div className="h-1 w-16 rounded-full bg-[#1C1C1C] overflow-hidden">
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                    animate={{ width: `${s.value * 100}%` }} transition={{ delay: i * 0.2 + 0.3, duration: 0.6 }}
                    style={{ backgroundColor: s.color }} />
                </div>
                <span style={{ color: s.color }} className="font-bold">{s.value}</span>
              </motion.div>
            )
          ))}
        </div>

        {/* Actions fired */}
        <div className="flex-1 rounded-xl border border-[#1C1C1C] bg-[#050505] p-4">
          <p className="text-[11px] text-[#888] mb-3">Agent actions fired</p>
          <div className="space-y-2.5">
            {[
              { label: "Webhook fired → CRM", icon: "⚡", delay: 2.6, active: phase >= 3 },
              { label: "Slack alert sent", icon: "💬", delay: 3.6, active: phase >= 4 },
              { label: "Lead captured: name + email", icon: "✓", delay: 4.8, active: phase >= 5 },
            ].map((a) => (
              <motion.div key={a.label} initial={{ opacity: 0, x: -8 }}
                animate={a.active ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                className="flex items-center gap-2.5 text-[12px]">
                <span>{a.icon}</span>
                <span className={a.active ? "text-white" : "text-[#333]"}>{a.label}</span>
                {a.active && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Slack notification */}
      {phase >= 4 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="w-52 rounded-xl border border-[#1C1C1C] bg-[#050505] p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-5 rounded bg-[#4a154b] flex items-center justify-center text-[10px]">S</div>
            <span className="text-[11px] text-[#888]">Slack · #sales-alerts</span>
          </div>
          <div className="border-l-2 border-[#00D9FF] pl-2.5">
            <p className="text-[11px] text-white font-semibold mb-1">🔥 High-intent lead detected</p>
            <p className="text-[10px] text-[#888] mb-2">Enterprise inquiry · urgency: HIGH</p>
            <div className="text-[10px] text-[#555] space-y-0.5">
              <p>Trigger: buying_intent (0.94)</p>
              <p>Session: enterprise-demo-flow</p>
            </div>
            <div className="mt-2 rounded-lg border border-[#1C1C1C] bg-[#111] px-3 py-1.5 text-center text-[11px] text-[#00D9FF] cursor-pointer">
              View conversation →
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Tab 3: Human Handoff ────────────────────────────────── */
function HandoffDemo() {
  const [status, setStatus] = useState<"waiting" | "active" | "resolved">("waiting");
  const [agentMsg, setAgentMsg] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStatus("active"), 2000);
    const t2 = setTimeout(() => setAgentMsg(true), 3200);
    const t3 = setTimeout(() => setStatus("resolved"), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="flex h-full gap-4">
      {/* Visitor chat */}
      <div className="flex-1 rounded-xl border border-[#1C1C1C] bg-[#050505] overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-[#1C1C1C] flex items-center gap-2">
          <span className="text-[10px] text-[#888]">Visitor chat</span>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {[
            { role: "assistant", text: "Hi! How can I help you today?" },
            { role: "user", text: "This is urgent — I need to speak to a real person about our account NOW" },
            { role: "system", text: "Connecting you to our team..." },
            ...(agentMsg ? [{ role: "agent", text: "Hi, I'm Sarah from the support team. I can see your account and I'm here to help — what's going on?" }] : []),
          ].map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "system" ? (
                <div className="mx-auto text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                  {msg.text}
                </div>
              ) : (
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                  msg.role === "user" ? "bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-white rounded-tr-sm"
                  : msg.role === "agent" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 rounded-tl-sm"
                  : "bg-[#111] border border-[#1C1C1C] text-[#ccc] rounded-tl-sm"
                }`}>{msg.text}</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Inbox card */}
      <div className="w-52 flex flex-col gap-2">
        <div className="rounded-xl border border-[#1C1C1C] bg-[#050505] p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <span className={`h-2 w-2 rounded-full ${status === "waiting" ? "bg-amber-400 animate-pulse" : status === "active" ? "bg-emerald-400" : "bg-[#555]"}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${status === "waiting" ? "text-amber-400" : status === "active" ? "text-emerald-400" : "text-[#555]"}`}>
              {status === "waiting" ? "Waiting" : status === "active" ? "Active" : "Resolved"}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-white mb-0.5">Sarah — Visitor</p>
          <p className="text-[10px] text-[#555] mb-2">Trigger: explicit_request</p>
          <div className="text-[10px] text-[#888] bg-[#111] border border-[#1C1C1C] rounded-lg p-2 mb-2 leading-relaxed">
            "Visitor is urgently requesting human support about their enterprise account."
          </div>
          {status === "waiting" && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full text-[11px] font-semibold text-white rounded-lg border border-[#1C1C1C] py-1.5 hover:border-[#00D9FF]/40 transition-colors">
              Claim →
            </motion.button>
          )}
          {status === "active" && (
            <div className="text-[11px] text-emerald-400 font-medium text-center">You're live</div>
          )}
        </div>

        <div className="rounded-xl border border-[#1C1C1C] bg-[#050505] p-3 space-y-1.5">
          <p className="text-[10px] text-[#555] mb-1.5">Sentiment</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-[#1C1C1C] overflow-hidden">
              <div className="h-full w-4/5 rounded-full bg-red-500" />
            </div>
            <span className="text-[10px] text-red-400">4.2 / 5</span>
          </div>
          <p className="text-[10px] text-[#555]">High frustration detected</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 4: Workflows ────────────────────────────────────── */
function WorkflowDemo() {
  const [activeNode, setActiveNode] = useState(-1);

  const nodes = [
    { label: "Lead Captured", icon: "⚡", color: "#00D9FF" },
    { label: "Wait 2 min", icon: "⏱", color: "#888" },
    { label: "Send Email", icon: "✉", color: "#f59e0b" },
    { label: "POST to CRM", icon: "🔗", color: "#a78bfa" },
    { label: "Slack Alert", icon: "💬", color: "#4ade80" },
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= nodes.length) { i = 0; setActiveNode(-1); return; }
      setActiveNode(i++);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Node graph */}
      <div className="flex-1 rounded-xl border border-[#1C1C1C] bg-[#050505] p-4">
        <p className="text-[11px] text-[#888] mb-4">Automation: Lead Nurture Sequence</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {nodes.map((node, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <motion.div
                animate={activeNode >= i ? { borderColor: node.color, backgroundColor: `${node.color}15` } : { borderColor: "#1C1C1C", backgroundColor: "#050505" }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-1.5 rounded-xl border p-3 w-[100px]">
                <div className="text-xl">{node.icon}</div>
                <span className="text-[10px] text-center text-white leading-tight">{node.label}</span>
                {activeNode === i && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: node.color }} />
                )}
              </motion.div>
              {i < nodes.length - 1 && (
                <motion.div animate={{ backgroundColor: activeNode > i ? "#00D9FF" : "#1C1C1C" }}
                  className="h-px w-6 shrink-0 transition-colors duration-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Run log */}
      <div className="rounded-xl border border-[#1C1C1C] bg-[#050505] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] text-[#888]">Recent runs</p>
          <span className="text-[10px] text-emerald-400">All passing ✓</span>
        </div>
        <div className="space-y-1.5">
          {[
            { time: "2 min ago", status: "success", steps: "5/5 steps" },
            { time: "18 min ago", status: "success", steps: "5/5 steps" },
            { time: "1 hr ago", status: "success", steps: "5/5 steps" },
          ].map((run, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-[#555]">{run.time}</span>
              <span className="text-[#888]">{run.steps}</span>
              <span className="text-emerald-500">✓ success</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 5: Analytics ────────────────────────────────────── */
function AnalyticsDemo() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 300); return () => clearTimeout(t); }, []);

  const bars = [40, 65, 50, 80, 72, 90, 68];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Conversations", value: "1,284", change: "+12%" },
          { label: "Leads captured", value: "94", change: "+8%" },
          { label: "Handoffs", value: "23", change: "-4%" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[#1C1C1C] bg-[#050505] p-3">
            <p className="text-[10px] text-[#555] mb-1">{s.label}</p>
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className={`text-[10px] ${s.change.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{s.change} this week</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="flex-1 rounded-xl border border-[#1C1C1C] bg-[#050505] p-4">
        <p className="text-[11px] text-[#888] mb-3">Conversations this week</p>
        <div className="flex items-end gap-2 h-24">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className="w-full rounded-t-sm"
                style={{ backgroundColor: "#00D9FF", opacity: 0.7 }}
                initial={{ height: 0 }}
                animate={mounted ? { height: `${h}%` } : { height: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
              />
              <span className="text-[9px] text-[#444]">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top questions */}
      <div className="rounded-xl border border-[#1C1C1C] bg-[#050505] p-3">
        <p className="text-[11px] text-[#888] mb-2">Top unanswered questions</p>
        <div className="space-y-1.5">
          {[
            "Can I integrate with Salesforce?",
            "Do you offer a free trial?",
          ].map((q, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.2 }}
              className="flex items-center gap-2 text-[11px]">
              <span className="text-[#00D9FF] font-mono text-[10px]">{i + 1}</span>
              <span className="text-[#888]">{q}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export function TabbedDemo() {
  const [activeTab, setActiveTab] = useState("chat");

  const tabContent: Record<string, React.ReactNode> = {
    chat: <ChatWidgetDemo />,
    agent: <AgentModeDemo />,
    handoff: <HandoffDemo />,
    workflows: <WorkflowDemo />,
    analytics: <AnalyticsDemo />,
  };

  return (
    <section id="demo" className="py-24 bg-black border-b border-[#1C1C1C]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
            See It In Action
          </div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight mb-4">
            Every feature. All in one platform.
          </h2>
          <p className="text-[#888] text-lg max-w-xl">
            From first message to lead capture to human escalation — AskYourSite handles the full support lifecycle.
          </p>
        </div>

        {/* Browser chrome */}
        <div className="rounded-2xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
          {/* macOS window bar */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1C1C1C]">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#1C1C1C]" />
              <div className="h-3 w-3 rounded-full bg-[#1C1C1C]" />
              <div className="h-3 w-3 rounded-full bg-[#1C1C1C]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 rounded-md border border-[#1C1C1C] bg-[#050505] px-4 py-1 text-[11px] text-[#444]">
                <span className="h-2 w-2 rounded-full bg-[#1C1C1C]" />
                app.askyoursite.com
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#1C1C1C] overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === id
                    ? "border-[#00D9FF] text-white"
                    : "border-transparent text-[#555] hover:text-[#888]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5 h-80">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {tabContent[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
