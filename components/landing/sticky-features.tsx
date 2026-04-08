"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Palette, Code2, BarChart3 } from "lucide-react";

/* ─── Feature steps ─────────────────────────────────────── */
const STEPS = [
  {
    id: "train",
    icon: Globe,
    title: "Train AI instantly",
    subtitle: "From URL to AI agent in under a minute",
    desc: "Enter your website URL and our AI reads everything — products, pricing, FAQs, docs, blogs. No manual copy-pasting, no spreadsheets. Just a URL.",
    bullets: [
      "Reads up to 500 pages automatically",
      "Understands tables, lists, and prose",
      "Auto-refreshes when your content changes",
    ],
    accent: "#3B82F6",
  },
  {
    id: "customize",
    icon: Palette,
    title: "Customize your agent",
    subtitle: "Looks and sounds like your brand",
    desc: "Set your brand colors, upload your logo, define your agent's name and personality. Customers will think it's a native part of your site.",
    bullets: [
      "Match any brand color scheme",
      "Custom welcome message & tone",
      "Remove AskYourSite branding",
    ],
    accent: "#8B5CF6",
  },
  {
    id: "embed",
    icon: Code2,
    title: "Embed anywhere",
    subtitle: "One script tag, any platform",
    desc: "Copy a single `<script>` tag and paste it into your site. Works on Webflow, WordPress, Shopify, Framer, or raw HTML — no plugins needed.",
    bullets: [
      "Works on any website platform",
      "Mobile responsive out of the box",
      "No performance impact",
    ],
    accent: "#10B981",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "See what's working",
    subtitle: "Analytics that actually matter",
    desc: "Track conversation volume, top questions, unanswered queries, and lead captures. Know exactly where customers are struggling.",
    bullets: [
      "Top questions & unanswered gaps",
      "Lead capture & conversion tracking",
      "Export data to CSV or Google Sheets",
    ],
    accent: "#F59E0B",
  },
];

/* ─── Left panel UI previews ─────────────────────────────── */
function TrainPreview() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 2)), 80);
    return () => clearInterval(t);
  }, []);
  const pages = ["Home · 2.3KB", "Pricing · 1.8KB", "About · 1.2KB", "FAQ · 3.1KB", "Blog · 4.5KB"];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
        <Globe className="h-4 w-4 text-blue-400 shrink-0" />
        <span className="text-sm text-slate-300">yourwebsite.com</span>
        <div className="ml-auto text-xs text-blue-400 font-medium">Scanning...</div>
      </div>
      <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-2">
        {pages.map((p, i) => (
          <motion.div
            key={p}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3 }}
            className="flex items-center gap-2 text-xs"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span className="text-slate-400">{p}</span>
            <div className="ml-auto text-green-500">✓</div>
          </motion.div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Training progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CustomizePreview() {
  const colors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % colors.length), 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <p className="text-xs text-slate-500 mb-3">Primary Color</p>
        <div className="flex gap-2">
          {colors.map((c, i) => (
            <motion.button
              key={c}
              animate={{ scale: active === i ? 1.2 : 1 }}
              className={`h-7 w-7 rounded-full border-2 transition-all ${active === i ? "border-white" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden transition-all duration-500" style={{ borderColor: colors[active] + "40" }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: colors[active] }}>
          <div className="h-6 w-6 rounded-full bg-white/20" />
          <span className="text-xs font-semibold text-white">My AI Agent</span>
        </div>
        <div className="p-3 bg-[#0D0D1A] space-y-2">
          <div className="rounded-xl rounded-tl-sm bg-white/5 border border-white/8 px-3 py-2 text-xs text-slate-400 max-w-[80%]">
            Hi! How can I help you today?
          </div>
          <div className="rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white max-w-[60%] ml-auto" style={{ backgroundColor: colors[active] + "40", borderColor: colors[active] + "60", border: "1px solid" }}>
            What are your prices?
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedPreview() {
  const code = `<script
  src="https://askyoursite.in/embed.js"
  data-agent-id="abc123xyz"
></script>`;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/8 bg-[#0A0A12] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-[10px] text-slate-600">index.html</span>
        </div>
        <pre className="text-xs text-violet-300 font-mono leading-relaxed whitespace-pre-wrap">{`</body>\n`}
          <span className="text-green-400">{code}</span>
{`\n</html>`}</pre>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-xs text-green-400">
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        Agent is live on your website
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Conversations", value: "1,284", color: "text-blue-400" },
          { label: "Leads Captured", value: "89", color: "text-green-400" },
          { label: "Avg Response", value: "0.8s", color: "text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <p className="text-xs text-slate-500 mb-3">Conversations this week</p>
        <div className="flex items-end gap-1.5 h-16">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex-1 rounded-sm bg-gradient-to-t from-violet-600 to-blue-500 opacity-80"
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-slate-600 mt-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const PREVIEWS = [TrainPreview, CustomizePreview, EmbedPreview, AnalyticsPreview];

/* ─── Main Component ─────────────────────────────────────── */
export function StickyFeatures() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = stepRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) setActiveStep(index);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    stepRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const Preview = PREVIEWS[activeStep];
  const step = STEPS[activeStep];

  return (
    <section ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-4">
            Everything in one place
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* LEFT: Sticky preview */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-white/10 bg-[#0D0D1A] p-6 shadow-[0_0_60px_rgba(139,92,246,0.1)]">
              {/* Panel header */}
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/6">
                <div
                  className="h-3 w-3 rounded-full transition-colors duration-500"
                  style={{ backgroundColor: step.accent }}
                />
                <span className="text-xs font-medium text-slate-400">{step.subtitle}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  <Preview />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Scrollable steps */}
          <div className="space-y-16">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === activeStep;
              return (
                <div
                  key={s.id}
                  ref={(el) => { stepRefs.current[i] = el; }}
                  className="cursor-default"
                >
                  <motion.div
                    animate={{ opacity: isActive ? 1 : 0.4 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-4"
                  >
                    <div
                      className="h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: isActive ? s.accent + "20" : "transparent",
                        borderColor: isActive ? s.accent + "40" : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Icon className="h-6 w-6" style={{ color: isActive ? s.accent : "#64748b" }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">{s.desc}</p>
                      <ul className="space-y-2">
                        {s.bullets.map((b) => (
                          <li key={b} className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.accent }} />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
