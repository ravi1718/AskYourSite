"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Code2, Zap, Clock, Globe } from "lucide-react";

/* ─── Demo conversation script ──────────────────────────── */
const CONVERSATIONS = [
  {
    user: "What plans do you offer?",
    assistant:
      "We have three plans: **Starter** at $20/mo (1 chatbot, 200 conversations), **Pro** at $69/mo (3 chatbots, 1,000 conversations), and **Business** at $149/mo (10 chatbots, 5,000 conversations). All plans start with a 7-day free trial — no credit card needed!",
    chips: ["Tell me about Pro features", "Is there a free tier?", "Compare all plans"],
  },
  {
    user: "Can I try it for free?",
    assistant:
      "Yes! Every plan comes with a 7-day free trial with full access to all features. No credit card required to start. You can train your AI on your website, customize it, and even embed it — all before paying anything.",
    chips: ["How do I start?", "What's included in trial?"],
  },
  {
    user: "How do I add it to my website?",
    assistant:
      "It's just one line of code! After training your AI, you'll get a script tag like this:\n```html\n<script src=\"https://askyoursite.in/embed.js\" data-agent-id=\"your-id\"></script>\n```\nPaste it before your closing `</body>` tag. Works on Webflow, WordPress, Shopify, Framer — any website.",
    chips: ["Does it work on Shopify?", "Any plugins available?"],
  },
  {
    user: "Can I book a demo call?",
    assistant:
      "Absolutely! I can help you schedule a personalized demo. Our team will walk you through setup, show you advanced features, and answer any questions specific to your use case.",
    chips: ["Schedule 30-min demo", "Talk to sales"],
    showCalendly: true,
  },
];

interface FeatureHighlight {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const FEATURES: FeatureHighlight[] = [
  { icon: <Zap className="h-5 w-5 text-yellow-400" />, title: "Answers in < 1 second", desc: "Instant AI responses trained on your content" },
  { icon: <Globe className="h-5 w-5 text-blue-400" />, title: "Learns from your site", desc: "Train on any URL — no manual copy-pasting" },
  { icon: <Clock className="h-5 w-5 text-green-400" />, title: "Live 24/7", desc: "Never miss a customer question, even at midnight" },
  { icon: <Code2 className="h-5 w-5 text-violet-400" />, title: "One script tag", desc: "Embed on any site — no coding required" },
];

/* ─── Live Demo Chat ─────────────────────────────────────── */
export function LiveDemoChat() {
  const [convIndex, setConvIndex] = useState(0);
  const [phase, setPhase] = useState<"user" | "typing" | "response" | "chips">("user");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [activeFeature, setActiveFeature] = useState(0);
  const [showCalendlyCard, setShowCalendlyCard] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const conv = CONVERSATIONS[convIndex];

  // Main conversation loop
  useEffect(() => {
    // Phase: user message visible → wait 1.2s → start typing
    if (phase === "user") {
      const t = setTimeout(() => setPhase("typing"), 1200);
      return () => clearTimeout(t);
    }

    // Phase: typing → stream response character by character
    if (phase === "typing") {
      setDisplayedResponse("");
      setShowCalendlyCard(false);
      let i = 0;
      const fullText = conv.assistant;

      const stream = () => {
        if (i < fullText.length) {
          setDisplayedResponse(fullText.slice(0, i + 1));
          i++;
          typingRef.current = setTimeout(stream, 12);
        } else {
          setPhase("response");
        }
      };
      typingRef.current = setTimeout(stream, 400);
      return () => { if (typingRef.current) clearTimeout(typingRef.current); };
    }

    // Phase: response done → show chips + Calendly if applicable → wait → advance
    if (phase === "response") {
      const t1 = setTimeout(() => {
        setPhase("chips");
        if (conv.showCalendly) setShowCalendlyCard(true);
      }, 300);
      return () => clearTimeout(t1);
    }

    if (phase === "chips") {
      const t = setTimeout(() => {
        setConvIndex((i) => (i + 1) % CONVERSATIONS.length);
        setPhase("user");
        setDisplayedResponse("");
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [phase, convIndex, conv]);

  // Cycle active feature highlight in sync
  useEffect(() => {
    const t = setInterval(() => setActiveFeature((i) => (i + 1) % FEATURES.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Parse bold markdown in response
  function renderText(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*|```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.slice(3, -3).replace(/^html\n/, "").trim();
        return (
          <pre key={i} className="mt-2 rounded-lg bg-black/40 border border-white/10 p-3 text-xs font-mono text-violet-300 overflow-x-auto whitespace-pre-wrap">
            {code}
          </pre>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <section id="demo" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Live Demo
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-4">
            See it in action
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Watch your AI answer real customer questions instantly, with zero setup.
          </p>
        </div>

        <div className="grid lg:grid-cols-[440px_1fr] gap-12 items-center" ref={sectionRef}>
          {/* ── Chat Window ── */}
          <div className="rounded-2xl border border-white/10 bg-[#0D0D1A] overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.12)]">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-violet-600 to-blue-600">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AskYourSite Agent</p>
                <p className="text-[10px] text-white/70 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  ONLINE
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/30" />
              </div>
            </div>

            {/* Messages area */}
            <div className="p-4 h-[340px] overflow-hidden space-y-4">
              {/* Welcome message */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-violet-400" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/8 px-4 py-2.5 text-sm text-slate-300 max-w-[85%]">
                  Hi! I&apos;m trained on your website. Ask me anything!
                </div>
              </motion.div>

              {/* User message */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`user-${convIndex}`}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-end"
                >
                  <div className="rounded-2xl rounded-tr-sm bg-violet-600/30 border border-violet-500/30 px-4 py-2.5 text-sm text-white max-w-[85%]">
                    {conv.user}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {phase === "typing" && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/8 px-4 py-3">
                      <span className="flex gap-1 h-4 items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Response */}
              <AnimatePresence>
                {(phase === "typing" || phase === "response" || phase === "chips") && displayedResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2"
                  >
                    <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/8 px-4 py-2.5 text-sm text-slate-300 max-w-[85%]">
                      {renderText(displayedResponse)}
                      {phase === "typing" && (
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 bg-violet-400 animate-blink align-middle" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Calendly card */}
              <AnimatePresence>
                {showCalendlyCard && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="ml-9 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3"
                  >
                    <p className="text-xs font-semibold text-blue-400 mb-2">📅 Schedule a Demo</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["10:00 AM", "2:00 PM", "4:30 PM"].map((t) => (
                        <div key={t} className="rounded-lg border border-blue-500/20 bg-blue-500/10 py-1.5 text-center text-[11px] text-blue-300">
                          {t}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggestion chips */}
              <AnimatePresence>
                {phase === "chips" && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="ml-9 flex flex-wrap gap-2"
                  >
                    {conv.chips.slice(0, 2).map((chip) => (
                      <span
                        key={chip}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-violet-500/30 text-violet-400"
                      >
                        {chip}
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input bar */}
            <div className="border-t border-white/8 bg-white/3 px-4 py-3 flex items-center gap-3">
              <div className="flex-1 text-sm text-slate-600 select-none">Ask a question...</div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-center opacity-50">
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Feature highlights ── */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-6">
              Everything your customers need, answered instantly
            </h3>

            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                animate={{
                  borderColor: activeFeature === i ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.06)",
                  backgroundColor: activeFeature === i ? "rgba(139,92,246,0.06)" : "transparent",
                }}
                transition={{ duration: 0.4 }}
                className="flex items-start gap-4 rounded-xl border p-4 cursor-default"
              >
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <p className={`font-semibold text-sm mb-1 transition-colors ${activeFeature === i ? "text-white" : "text-slate-300"}`}>
                    {feat.title}
                  </p>
                  <p className="text-xs text-slate-500">{feat.desc}</p>
                </div>
              </motion.div>
            ))}

            {/* CTA */}
            <div className="pt-4">
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-blue-500 transition-all"
              >
                Try it on your website
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
