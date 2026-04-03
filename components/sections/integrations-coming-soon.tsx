"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import { BentoCard } from "@/components/ui/bento-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { CheckCircle2, BellRing } from "lucide-react";

/* ─── SVG Logo Components ─────────────────────────────────── */

function SlackLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      {/* Pink/Red column-left */}
      <rect x="5.5" y="2" width="3" height="7" rx="1.5" fill="#E01E5A" />
      <rect x="2" y="5.5" width="7" height="3" rx="1.5" fill="#E01E5A" />
      <circle cx="7" cy="7" r="1.5" fill="#E01E5A" />
      {/* Blue column-right top */}
      <rect x="15.5" y="2" width="3" height="7" rx="1.5" fill="#36C5F0" />
      <rect x="15" y="5.5" width="7" height="3" rx="1.5" fill="#36C5F0" />
      <circle cx="17" cy="7" r="1.5" fill="#36C5F0" />
      {/* Green column-left bottom */}
      <rect x="5.5" y="15" width="3" height="7" rx="1.5" fill="#2EB67D" />
      <rect x="2" y="15.5" width="7" height="3" rx="1.5" fill="#2EB67D" />
      <circle cx="7" cy="17" r="1.5" fill="#2EB67D" />
      {/* Yellow column-right bottom */}
      <rect x="15.5" y="15" width="3" height="7" rx="1.5" fill="#ECB22E" />
      <rect x="15" y="15.5" width="7" height="3" rx="1.5" fill="#ECB22E" />
      <circle cx="17" cy="17" r="1.5" fill="#ECB22E" />
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

function ZapierLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2z" fill="#FF4A00" />
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

function CalDotComLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#10b981" strokeWidth="1.5" />
      <rect x="3" y="9" width="18" height="1.5" fill="#10b981" opacity="0.3" />
      <rect x="8" y="2.5" width="2" height="5" rx="1" fill="#10b981" />
      <rect x="14" y="2.5" width="2" height="5" rx="1" fill="#10b981" />
      <circle cx="12" cy="15" r="2.5" fill="#10b981" />
    </svg>
  );
}

function CalendlyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M19.5 6.5A9 9 0 1 0 19.5 17.5"
        stroke="#006BFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="3" fill="#006BFF" />
    </svg>
  );
}

/* ─── Background Animations ───────────────────────────────── */

const slackMessages = [
  { initial: "E", color: "#E01E5A", text: "AskYourSite answered 47 questions today!", width: "80%" },
  { initial: "M", color: "#36C5F0", text: "Zero support tickets this morning 🎉", width: "70%" },
  { initial: "J", color: "#2EB67D", text: "The AI handled pricing FAQs automatically", width: "75%" },
];

const msgContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.4 } },
};
const msgItem: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function SlackBackground() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: "0px 0px -80px 0px" });
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setKey((k) => k + 1), 4500);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-center px-6 pt-6 gap-3">
      {/* Slack header bar */}
      <div className="flex items-center gap-2 mb-1">
        <div className="h-5 w-5 rounded bg-[#E01E5A]/20 flex items-center justify-center">
          <SlackLogo className="h-3 w-3" />
        </div>
        <span className="text-[11px] text-white/40 font-medium"># askyoursite-alerts</span>
        <span className="ml-auto text-[10px] text-white/20">just now</span>
      </div>
      <motion.div key={key} variants={msgContainer} initial="hidden" animate={inView ? "visible" : "hidden"} className="flex flex-col gap-2.5">
        {slackMessages.map((msg, i) => (
          <motion.div key={i} variants={msgItem} className="flex items-start gap-2.5">
            <div
              className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
              style={{ backgroundColor: msg.color }}
            >
              {msg.initial}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="h-2 rounded-full bg-white/20" style={{ width: "30%" }} />
              <div className="h-2 rounded-full bg-white/10" style={{ width: msg.width }} />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

const blockVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.35 } },
};
const blockItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function NotionBackground() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: "0px 0px -80px 0px" });

  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center px-6 pt-8">
      <div className="w-full rounded-xl bg-white/[0.04] border border-white/8 p-4 flex flex-col gap-2.5">
        <motion.div variants={blockVariants} initial="hidden" animate={inView ? "visible" : "hidden"}>
          {/* Title block */}
          <motion.div variants={blockItem} className="h-4 w-3/4 rounded bg-white/25 mb-3" />
          {/* Paragraph lines */}
          <motion.div variants={blockItem} className="h-2 w-full rounded bg-white/10 mb-1.5" />
          <motion.div variants={blockItem} className="h-2 w-5/6 rounded bg-white/10 mb-3" />
          {/* Callout block */}
          <motion.div variants={blockItem} className="flex gap-2 rounded-lg bg-white/5 border-l-2 border-white/30 p-2.5">
            <span className="text-sm">💡</span>
            <div className="flex flex-col gap-1 flex-1">
              <div className="h-2 w-3/4 rounded bg-white/15" />
              <div className="h-2 w-1/2 rounded bg-white/10" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

const nodes = [
  { label: "New Message", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  { label: "AskYourSite", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
  { label: "Notify Team", color: "#FF4A00", bg: "rgba(255,74,0,0.15)" },
];

function ZapierBackground() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 pt-6">
      <div className="flex flex-col items-center gap-3 w-full">
        {nodes.map((node, i) => (
          <React.Fragment key={i}>
            <motion.div
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border w-fit"
              style={{ color: node.color, borderColor: `${node.color}40`, backgroundColor: node.bg }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }}
            >
              {i === 0 && <span>💬</span>}
              {i === 1 && <ZapierLogo className="h-3.5 w-3.5" />}
              {i === 2 && <span>🔔</span>}
              {node.label}
            </motion.div>
            {i < nodes.length - 1 && (
              <div className="flex flex-col items-center gap-0.5">
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: nodes[i].color }}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, delay: dot * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

const docLines = [
  { width: "60%", opacity: "bg-white/25", height: "h-3" },
  { width: "90%", opacity: "bg-white/12", height: "h-2" },
  { width: "75%", opacity: "bg-white/12", height: "h-2" },
  { width: "45%", opacity: "bg-white/12", height: "h-2" },
];
const lineVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.3 } },
};
const lineItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function DocsBackground() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: "0px 0px -80px 0px" });

  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center px-6 pt-8">
      <div className="w-full rounded-xl bg-white/[0.03] border border-white/8 p-4 flex flex-col gap-2.5">
        {/* Docs header */}
        <div className="flex items-center gap-2 mb-1">
          <GoogleDocsLogo className="h-4 w-4" />
          <div className="h-2 w-28 rounded bg-white/20" />
        </div>
        <motion.div variants={lineVariants} initial="hidden" animate={inView ? "visible" : "hidden"} className="flex flex-col gap-2">
          {docLines.map((line, i) => (
            <motion.div key={i} variants={lineItem} className="flex items-center gap-1">
              <div className={`rounded ${line.height} ${line.opacity}`} style={{ width: line.width }} />
              {i === docLines.length - 1 && (
                <div className="h-4 w-0.5 bg-[#4285F4] animate-blink" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const days = ["M", "T", "W", "T", "F"];
const timeSlots = ["9:00 AM", "10:30 AM", "2:00 PM", "4:30 PM"];

function CalBackground() {
  const bookedCells = [2, 7, 14];

  return (
    <div className="absolute inset-0 flex items-center justify-center px-5 pt-6">
      <div className="w-full rounded-xl bg-white/[0.03] border border-white/8 p-3.5 flex flex-col gap-3">
        {/* Month header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/50 font-medium">April 2025</span>
          <CalDotComLogo className="h-4 w-4" />
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-5 gap-1">
          {days.map((d) => (
            <div key={d} className="text-center text-[9px] text-white/30 font-medium">{d}</div>
          ))}
        </div>
        {/* Calendar cells */}
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 20 }, (_, i) => {
            const isBooked = bookedCells.includes(i);
            const isToday = i === 4;
            return (
              <motion.div
                key={i}
                className="aspect-square rounded-md flex items-center justify-center text-[9px] font-medium"
                animate={
                  isBooked
                    ? { backgroundColor: "#10b98125", borderColor: "#10b98150" }
                    : isToday
                    ? { backgroundColor: "#10b981", color: "#fff" }
                    : { backgroundColor: "rgba(255,255,255,0.03)" }
                }
                style={{
                  border: isBooked ? "1px solid transparent" : "1px solid rgba(255,255,255,0.06)",
                  color: isBooked ? "#10b981" : isToday ? "#fff" : "rgba(255,255,255,0.3)",
                }}
              >
                {i + 1}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalendlyBackground() {
  const [activeSlot, setActiveSlot] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveSlot((s) => (s + 1) % timeSlots.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 flex items-start justify-start px-5 pt-5 gap-3">
      {/* Left: Day strip */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center gap-1 mb-1">
          <CalendlyLogo className="h-3.5 w-3.5" />
          <span className="text-[9px] text-white/30 font-medium">April</span>
        </div>
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[8px] text-white/30">{d}</span>
            <div className="flex flex-col gap-0.5">
              {[0, 1].map((dot) => (
                <motion.div
                  key={dot}
                  className="h-1.5 w-1.5 rounded-full"
                  animate={{ backgroundColor: i === 1 || i === 3 ? "#006BFF" : "rgba(255,255,255,0.1)" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right: Time slot picker */}
      <div className="flex flex-col gap-2 flex-1 pt-6">
        <span className="text-[9px] text-white/30 font-medium mb-0.5">Available times</span>
        {timeSlots.map((slot, i) => (
          <motion.div
            key={i}
            className="rounded-lg px-3 py-1.5 text-[11px] font-medium border cursor-pointer"
            animate={{
              backgroundColor: activeSlot === i ? "#006BFF20" : "rgba(255,255,255,0.03)",
              borderColor: activeSlot === i ? "#006BFF60" : "rgba(255,255,255,0.08)",
              color: activeSlot === i ? "#006BFF" : "rgba(255,255,255,0.4)",
            }}
            transition={{ duration: 0.3 }}
          >
            {slot}
          </motion.div>
        ))}
        <motion.div
          className="mt-1 rounded-lg py-1.5 text-center text-[11px] font-semibold text-white"
          animate={{ backgroundColor: ["#006BFF", "#0052CC", "#006BFF"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Confirm →
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Notify CTA Card ────────────────────────────────────── */

function NotifyCTACard({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "integrations-coming-soon" }),
      });
    } catch {
      // silent
    }
    setStatus("done");
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0f0f0f] flex flex-col items-center justify-center p-6 text-center ${className ?? ""}`}
    >
      <BorderBeam colorFrom="#3b82f6" colorTo="#006BFF" duration={6} />

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
        <BellRing className="h-5 w-5 text-primary" />
      </div>

      <h3 className="text-base font-semibold text-white mb-1">Get notified first</h3>
      <p className="text-sm text-white/40 mb-5 leading-relaxed">
        Be the first to know when integrations go live.
      </p>

      <AnimatePresence mode="wait">
        {status === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <CheckCircle2 className="h-8 w-8 text-green-400" />
            <p className="text-sm font-medium text-green-400">You&apos;re on the list!</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/40 transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </>
              ) : (
                "Notify me"
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Section ───────────────────────────────────────── */

const integrations = [
  {
    name: "Slack",
    description: "Get instant AI-powered alerts and answers delivered directly to your Slack channels.",
    accentColor: "#E01E5A",
    className: "lg:col-span-2",
    icon: <SlackLogo className="h-8 w-8" />,
    background: <SlackBackground />,
  },
  {
    name: "Notion",
    description: "Sync your Notion workspace as a knowledge base and keep your AI agent always up to date.",
    accentColor: "#ffffff",
    className: "lg:col-span-1",
    icon: <NotionLogo className="h-8 w-8" />,
    background: <NotionBackground />,
  },
  {
    name: "Zapier",
    description: "Connect AskYourSite to 5,000+ apps and automate workflows without writing a single line of code.",
    accentColor: "#FF4A00",
    className: "lg:col-span-1",
    icon: <ZapierLogo className="h-8 w-8" />,
    background: <ZapierBackground />,
  },
  {
    name: "Google Docs",
    description: "Import Google Docs instantly to train your AI agent on your latest content and documentation.",
    accentColor: "#4285F4",
    className: "lg:col-span-1",
    icon: <GoogleDocsLogo className="h-8 w-8" />,
    background: <DocsBackground />,
  },
  {
    name: "Cal.com",
    description: "Let your AI agent check availability and book meetings directly from the chat window.",
    accentColor: "#10b981",
    className: "lg:col-span-1",
    icon: <CalDotComLogo className="h-8 w-8" />,
    background: <CalBackground />,
  },
  {
    name: "Calendly",
    description: "Seamlessly integrate booking flows so visitors can schedule time with your team without leaving the chat.",
    accentColor: "#006BFF",
    className: "lg:col-span-2",
    icon: <CalendlyLogo className="h-8 w-8" />,
    background: <CalendlyBackground />,
  },
];

export function IntegrationsComingSoon() {
  return (
    <section id="integrations" className="relative z-10 mx-auto max-w-7xl px-6 py-28 lg:px-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Section header */}
      <div className="relative mb-16 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Integrations
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Connect with the tools you love
        </h2>
        <p className="mt-3 text-white/50 max-w-2xl mx-auto text-base leading-relaxed">
          Powerful integrations coming soon to supercharge your AI agent and fit right into your existing workflow.
        </p>
      </div>

      {/* Bento grid */}
      <div className="relative grid auto-rows-[22rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <BentoCard key={integration.name} {...integration} />
        ))}
        {/* 7th slot: Notify CTA */}
        <NotifyCTACard className="lg:col-span-1" />
      </div>
    </section>
  );
}
