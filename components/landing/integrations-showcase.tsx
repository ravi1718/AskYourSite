"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ArrowRight } from "lucide-react";
import Link from "next/link";

/* ─── SVG Logos ─────────────────────────────────────────── */
function SlackLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="5.5" y="2" width="3" height="7" rx="1.5" fill="#E01E5A" />
      <rect x="2" y="5.5" width="7" height="3" rx="1.5" fill="#E01E5A" />
      <circle cx="7" cy="7" r="1.5" fill="#E01E5A" />
      <rect x="15.5" y="2" width="3" height="7" rx="1.5" fill="#36C5F0" />
      <rect x="15" y="5.5" width="7" height="3" rx="1.5" fill="#36C5F0" />
      <circle cx="17" cy="7" r="1.5" fill="#36C5F0" />
      <rect x="5.5" y="15" width="3" height="7" rx="1.5" fill="#2EB67D" />
      <rect x="2" y="15.5" width="7" height="3" rx="1.5" fill="#2EB67D" />
      <circle cx="7" cy="17" r="1.5" fill="#2EB67D" />
      <rect x="15.5" y="15" width="3" height="7" rx="1.5" fill="#ECB22E" />
      <rect x="15" y="15.5" width="7" height="3" rx="1.5" fill="#ECB22E" />
      <circle cx="17" cy="17" r="1.5" fill="#ECB22E" />
    </svg>
  );
}

function CalendlyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M19.5 6.5A9 9 0 1 0 19.5 17.5" stroke="#006BFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <polyline points="13,9 16,12 13,15" stroke="#006BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function NotionLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="white">
      <path d="M6 4h2.5l7 11V4H18v16h-2.5L8.5 9v11H6V4z" />
    </svg>
  );
}

function GoogleDocsLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <rect x="4" y="2" width="13" height="18" rx="1.5" fill="#4285F4" />
      <path d="M13 2l4 4h-4V2z" fill="#2563EB" />
      <rect x="7" y="9" width="7" height="1.5" rx="0.75" fill="white" opacity="0.85" />
      <rect x="7" y="12" width="7" height="1.5" rx="0.75" fill="white" opacity="0.85" />
      <rect x="7" y="15" width="4.5" height="1.5" rx="0.75" fill="white" opacity="0.85" />
    </svg>
  );
}

function ZapierLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2z" fill="#FF4A00" />
    </svg>
  );
}

function HubSpotLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="16.5" cy="7.5" r="2.5" fill="#FF7A59" />
      <path d="M14 7.5H8C6.34 7.5 5 8.84 5 10.5v0C5 12.16 6.34 13.5 8 13.5h1v3.5l3.5-3.5H14c1.66 0 3-1.34 3-3v0C17 8.84 15.66 7.5 14 7.5z" fill="#FF7A59" />
    </svg>
  );
}

/* ─── Integration definitions ────────────────────────────── */
const INTEGRATIONS = [
  {
    id: "slack",
    name: "Slack",
    desc: "Send alerts to your team for buying signals, unanswered questions, and lead captures.",
    logo: SlackLogo,
    color: "#4A154B",
    accent: "#E01E5A",
    scenario: "buying",
  },
  {
    id: "calendly",
    name: "Calendly",
    desc: "Automatically show a booking calendar when visitors express interest in a demo or meeting.",
    logo: CalendlyLogo,
    color: "#006BFF15",
    accent: "#006BFF",
    scenario: "booking",
  },
  {
    id: "notion",
    name: "Notion",
    desc: "Sync your Notion pages and databases as a knowledge base — auto-updates included.",
    logo: NotionLogo,
    color: "#1a1a1a",
    accent: "#ffffff",
    scenario: "notion",
  },
  {
    id: "gdocs",
    name: "Google Docs",
    desc: "Pull content from Google Docs, Sheets, and Drive to train your AI agent.",
    logo: GoogleDocsLogo,
    color: "#4285F415",
    accent: "#4285F4",
    scenario: "gdocs",
  },
  {
    id: "zapier",
    name: "Zapier",
    desc: "Connect to 5,000+ apps. Trigger workflows when your AI captures a lead.",
    logo: ZapierLogo,
    color: "#FF4A0015",
    accent: "#FF4A00",
    scenario: "zapier",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    desc: "Sync captured leads directly to HubSpot CRM with conversation history.",
    logo: HubSpotLogo,
    color: "#FF7A5915",
    accent: "#FF7A59",
    scenario: "hubspot",
  },
];

/* ─── Chat scenarios ─────────────────────────────────────── */
const CHAT_SCENARIOS = [
  {
    integration: "slack",
    messages: [
      { role: "user", content: "I'm interested in the Pro plan, can you tell me more?" },
      { role: "ai", content: "The Pro plan at $69/mo gives you 3 AI agents, 1,000 conversations/mo, and full customization. Would you like to start a free trial?" },
    ],
    popup: {
      type: "slack",
      content: { channel: "#sales-alerts", text: "🔥 Hot lead! Visitor asking about Pro plan upgrade", time: "just now" },
    },
  },
  {
    integration: "calendly",
    messages: [
      { role: "user", content: "Can we schedule a product demo?" },
      { role: "ai", content: "Absolutely! I can help you book a personalized demo. Pick a time that works for you:" },
    ],
    popup: {
      type: "calendly",
      content: { slots: ["Tomorrow, 10:00 AM", "Tomorrow, 2:00 PM", "Friday, 11:00 AM"] },
    },
  },
  {
    integration: "notion",
    messages: [
      { role: "user", content: "How does the Notion sync work?" },
      { role: "ai", content: "Your Notion pages sync automatically every 24 hours. Any updates you make in Notion reflect in your AI agent instantly." },
    ],
    popup: {
      type: "notion",
      content: { pages: ["Product Docs", "FAQ", "Pricing Guide", "Case Studies"] },
    },
  },
];

/* ─── Popup components ───────────────────────────────────── */
function SlackPopup({ content }: { content: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24 }}
      className="absolute -right-4 top-8 z-20 w-72 rounded-xl border border-white/10 bg-[#1A1A2E] shadow-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <SlackLogo className="h-5 w-5" />
        <span className="text-xs font-semibold text-white">Slack</span>
        <span className="ml-auto text-[10px] text-slate-500">{content.time}</span>
      </div>
      <div className="text-xs text-slate-400 mb-1">{content.channel}</div>
      <div className="text-sm text-white">{content.text}</div>
    </motion.div>
  );
}

function CalendlyPopup({ content }: { content: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16 }}
      className="absolute -right-4 top-8 z-20 w-64 rounded-xl border border-blue-500/30 bg-[#0A1628] shadow-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <CalendlyLogo className="h-5 w-5" />
        <span className="text-xs font-semibold text-white">Schedule a Demo</span>
      </div>
      <div className="space-y-2">
        {content.slots.map((slot: string) => (
          <div key={slot} className="rounded-lg border border-blue-500/20 bg-blue-500/10 py-2 px-3 text-xs text-blue-300 cursor-pointer hover:bg-blue-500/20 transition-colors">
            📅 {slot}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function NotionPopup({ content }: { content: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24 }}
      className="absolute -right-4 top-8 z-20 w-60 rounded-xl border border-white/10 bg-[#191919] shadow-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <NotionLogo className="h-4 w-4" />
        <span className="text-xs font-semibold text-white">Syncing pages...</span>
      </div>
      <div className="space-y-1.5">
        {content.pages.map((page: string, i: number) => (
          <motion.div
            key={page}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-2 text-xs text-slate-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {page}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export function IntegrationsShowcase() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [chatPhase, setChatPhase] = useState<"msg1" | "typing" | "msg2" | "popup">("msg1");
  const [activeIntegrationId, setActiveIntegrationId] = useState(CHAT_SCENARIOS[0].integration);

  const scenario = CHAT_SCENARIOS[scenarioIndex];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (chatPhase === "msg1") t = setTimeout(() => setChatPhase("typing"), 1200);
    else if (chatPhase === "typing") t = setTimeout(() => setChatPhase("msg2"), 1800);
    else if (chatPhase === "msg2") t = setTimeout(() => setChatPhase("popup"), 800);
    else if (chatPhase === "popup") {
      t = setTimeout(() => {
        const next = (scenarioIndex + 1) % CHAT_SCENARIOS.length;
        setScenarioIndex(next);
        setActiveIntegrationId(CHAT_SCENARIOS[next].integration);
        setChatPhase("msg1");
      }, 4000);
    }
    return () => clearTimeout(t);
  }, [chatPhase, scenarioIndex]);

  const activeIntegration = INTEGRATIONS.find((i) => i.id === activeIntegrationId);

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            Integrations · Live Now
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-4">
            Works with your favorite tools
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Connect your AI agent to Slack, Calendly, Notion, Google Docs and more — in one click.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">
          {/* ── Integration grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {INTEGRATIONS.map((intg) => {
              const Logo = intg.logo;
              const isActive = intg.id === activeIntegrationId;
              return (
                <motion.div
                  key={intg.id}
                  animate={{
                    borderColor: isActive ? intg.accent + "60" : "rgba(255,255,255,0.06)",
                    backgroundColor: isActive ? intg.accent + "08" : "rgba(255,255,255,0.02)",
                  }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-2xl border p-5 cursor-default overflow-hidden"
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-glow"
                      className="absolute inset-0 rounded-2xl"
                      style={{ boxShadow: `0 0 30px ${intg.accent}20 inset` }}
                    />
                  )}
                  <Logo className="h-8 w-8 mb-3" />
                  <p className="text-sm font-semibold text-white mb-1">{intg.name}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{intg.desc}</p>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium"
                      style={{ color: intg.accent }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: intg.accent }} />
                      Active
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* ── Live chat + popup ── */}
          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-[#0D0D1A] overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-blue-600">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">AI Agent</p>
                  <p className="text-[9px] text-white/60 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    LIVE
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-3 h-52 overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {/* User message 1 */}
                  {(chatPhase === "msg1" || chatPhase === "typing" || chatPhase === "msg2" || chatPhase === "popup") && (
                    <motion.div
                      key={`u1-${scenarioIndex}`}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-end"
                    >
                      <div className="rounded-2xl rounded-tr-sm bg-violet-600/30 border border-violet-500/30 px-3 py-2 text-xs text-white max-w-[85%]">
                        {scenario.messages[0].content}
                      </div>
                    </motion.div>
                  )}

                  {/* Typing */}
                  {chatPhase === "typing" && (
                    <motion.div
                      key="typing"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-2"
                    >
                      <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/8 px-3 py-2.5">
                        <span className="flex gap-1 h-3 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* AI response */}
                  {(chatPhase === "msg2" || chatPhase === "popup") && (
                    <motion.div
                      key={`ai-${scenarioIndex}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-2"
                    >
                      <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/8 px-3 py-2 text-xs text-slate-300 max-w-[85%]">
                        {scenario.messages[1].content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Popup overlays */}
            <AnimatePresence>
              {chatPhase === "popup" && scenario.popup.type === "slack" && (
                <SlackPopup content={scenario.popup.content} />
              )}
              {chatPhase === "popup" && scenario.popup.type === "calendly" && (
                <CalendlyPopup content={scenario.popup.content} />
              )}
              {chatPhase === "popup" && scenario.popup.type === "notion" && (
                <NotionPopup content={scenario.popup.content} />
              )}
            </AnimatePresence>

            {/* Active integration label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={activeIntegrationId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-xs text-center text-slate-500"
              >
                Showing: <span className="text-slate-300 font-medium">{activeIntegration?.name}</span> integration
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard/integrations"
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            View all integrations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
