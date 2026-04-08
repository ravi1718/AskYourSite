"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Sparkles,
  Globe,
  CheckCircle2,
  Loader2,
  Send,
  X,
  ChevronRight,
  Lock,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
type DemoState = "idle" | "crawling" | "ready" | "limit";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CrawlData {
  chunks: string[];
  pagesCrawled: number;
  urls: string[];
  domain: string;
}

/* ─── Suggested questions ────────────────────────────────── */
const SUGGESTED_QUESTIONS = [
  "What does this website offer?",
  "What are the main features?",
  "How much does it cost?",
  "How do I get started?",
  "Is there a free trial?",
];

/* ─── Crawl progress steps ───────────────────────────────── */
const CRAWL_STEPS = [
  "Connecting to website...",
  "Discovering pages...",
  "Reading content...",
  "Building knowledge base...",
  "AI is ready!",
];

/* ─── Hero Section ───────────────────────────────────────── */
export function HeroSection() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<DemoState>("idle");
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [crawlStep, setCrawlStep] = useState(0);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showLimit, setShowLimit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Animate crawl steps
  useEffect(() => {
    if (state !== "crawling") return;
    const interval = setInterval(() => {
      setCrawlStep((s) => Math.min(s + 1, CRAWL_STEPS.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [state]);

  async function handleTrain() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setError("");
    setState("crawling");
    setCrawlStep(0);

    try {
      const res = await fetch("/api/demo/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Training failed");

      setCrawlData(data);
      setMessages([
        {
          role: "assistant",
          content: `I've read ${data.pagesCrawled} page${data.pagesCrawled !== 1 ? "s" : ""} from **${data.domain}** and I'm ready to answer questions! What would you like to know?`,
        },
      ]);
      setState("ready");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setState("idle");
    }
  }

  async function handleSend(text?: string) {
    const msg = (text || input).trim();
    if (!msg || isTyping || !crawlData) return;

    const newCount = messageCount + 1;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsTyping(true);
    setMessageCount(newCount);

    try {
      const context = crawlData.chunks.slice(0, 15).join("\n\n---\n\n");
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: msg }],
          context,
          messageCount: newCount - 1,
          domain: crawlData.domain,
        }),
      });
      const data = await res.json();

      if (data.limitReached) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "You've reached the demo limit! Sign up for free to deploy your own AI agent with unlimited conversations.",
          },
        ]);
        setTimeout(() => setState("limit"), 1500);
        return;
      }

      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        if (data.limitReached || data.messagesRemaining === 0) {
          setTimeout(() => setState("limit"), 2000);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  // When chat is active, render as full-page takeover (fixed below navbar) — no scroll fighting
  if (state === "ready" || state === "limit") {
    return (
      <>
        <div className="fixed inset-0 top-[65px] z-40 flex flex-col bg-[#0D0D1A] px-4 py-4">
          {/* Glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
          </div>

          <div className="relative z-10 flex flex-col h-full w-full max-w-2xl mx-auto">
            {/* Header bar */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>
                  Trained on <strong className="text-white">{crawlData?.domain}</strong>
                  {" · "}
                  {crawlData?.pagesCrawled} page{crawlData?.pagesCrawled !== 1 ? "s" : ""} read
                </span>
              </div>
              <button
                onClick={() => { setState("idle"); setMessages([]); setMessageCount(0); setCrawlData(null); }}
                className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Try another URL
              </button>
            </div>

            {/* Chat window — fills remaining height */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col flex-1 min-h-0 rounded-2xl border border-white/10 bg-[#0A0A14] overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)]"
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/8 bg-gradient-to-r from-violet-600/90 to-blue-600/90 shrink-0">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{crawlData?.domain} AI Agent</p>
                  <p className="text-[10px] text-white/70 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    ONLINE · DEMO MODE
                  </p>
                </div>
                <div className="ml-auto text-xs text-white/50">
                  {Math.max(0, 5 - messageCount)} messages left
                </div>
              </div>

              {/* Messages — scrollable, fills all available space */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-violet-400" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-tr-sm bg-violet-600/30 border border-violet-500/30 text-white"
                          : "rounded-tl-sm bg-white/5 border border-white/8 text-slate-200"
                      }`}
                    >
                      {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
                        ) : <span key={j}>{part}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start gap-2">
                    <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/5 border border-white/8">
                      <span className="flex gap-1 items-center h-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested questions */}
              {messages.length === 1 && !isTyping && (
                <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
                  {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                    <button key={q} onClick={() => handleSend(q)}
                      className="text-xs px-3 py-1.5 rounded-full border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              {state === "ready" && (
                <div className="border-t border-white/8 bg-white/3 px-4 py-3 flex items-center gap-3 shrink-0">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={`Ask anything about ${crawlData?.domain}...`}
                    disabled={isTyping}
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                  />
                  <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
                    className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-center disabled:opacity-40 transition-opacity">
                    <Send className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Limit modal */}
        <AnimatePresence>
          {state === "limit" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111128] p-8 text-center shadow-[0_0_80px_rgba(139,92,246,0.2)]">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Your AI just answered 5 questions!</h3>
                <p className="text-slate-400 text-sm mb-1">from <span className="text-violet-400 font-medium">{crawlData?.domain}</span></p>
                <p className="text-slate-500 text-sm mb-8">Sign up to deploy this AI agent on your site, remove limits, and unlock all features.</p>
                <div className="space-y-3">
                  <Link href="/login" className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-blue-500 transition-all">
                    <Sparkles className="h-4 w-4" /> Create free account — no credit card
                  </Link>
                  <button onClick={() => setState("ready")} className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 py-3 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-all">
                    Continue exploring demo <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-6 space-y-2 text-left">
                  {["Unlimited conversations", "Custom branding & colors", "Lead capture & analytics", "Slack & Calendly integrations"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />{f}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-16 overflow-hidden">
      {/* Animated background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[120px] animate-breathe" />
        <div className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-600/8 blur-[100px] animate-breathe [animation-delay:2s]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── IDLE / INPUT STATE ── */}
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-400"
            >
              <Sparkles className="h-3 w-3 animate-pulse" />
              AI-Powered Sales &amp; Support Agent
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white leading-[1.05] mb-6"
            >
              Turn Your Website Into{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                an AI Sales Agent
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10"
            >
              Train AI on your content and let it answer customer questions instantly —{" "}
              <span className="text-white">no code required.</span>
            </motion.p>

            {/* URL Input */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="w-full max-w-xl mb-4"
            >
              <div className="flex rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-1.5 focus-within:border-violet-500/50 focus-within:bg-violet-500/5 transition-all">
                <div className="flex items-center pl-4 pr-2 text-slate-500">
                  <Globe className="h-4 w-4" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleTrain()}
                  placeholder="yourwebsite.com"
                  className="flex-1 bg-transparent py-3 pr-2 text-white placeholder-slate-500 outline-none text-sm"
                />
                <button
                  onClick={handleTrain}
                  disabled={!url.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate AI
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-400 text-left px-2">{error}</p>
              )}
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500 mb-10"
            >
              {["No credit card required", "Reads up to 3 pages instantly", "5 free demo messages"].map(
                (t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {t}
                  </span>
                )
              )}
            </motion.div>

            {/* Secondary CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={() => document.getElementById("live-demo")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Watch how it works
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ── CRAWLING STATE ── */}
        {state === "crawling" && (
          <motion.div
            key="crawling"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex flex-col items-center text-center max-w-md w-full"
          >
            <div className="w-full rounded-2xl border border-white/10 bg-[#111128] p-8">
              {/* Spinner */}
              <div className="relative mx-auto mb-6 h-20 w-20">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-spin-slow" />
                <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="h-8 w-8 text-violet-400" />
                </div>
              </div>

              <p className="text-sm font-medium text-slate-300 mb-1">
                Training on{" "}
                <span className="text-white font-semibold">
                  {url.replace(/^https?:\/\//, "").split("/")[0]}
                </span>
              </p>

              {/* Step indicator */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={crawlStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-xs text-violet-400 mb-6 h-4"
                >
                  {CRAWL_STEPS[crawlStep]}
                </motion.p>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2">
                {CRAWL_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i <= crawlStep
                        ? "w-6 bg-violet-500"
                        : "w-1.5 bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-4 text-[11px] text-slate-600">
                This takes about 15–30 seconds
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </section>
  );
}
