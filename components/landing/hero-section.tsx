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
  Send,
  X,
  Star,
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

const SUGGESTED_QUESTIONS = [
  "What does this website offer?",
  "What are the main features?",
  "How much does it cost?",
];

const CRAWL_STEPS = [
  "Connecting to website...",
  "Discovering pages...",
  "Reading content...",
  "Building knowledge base...",
  "AI is ready!",
];

/* ─── 3D Widget Mockup (CSS-based) ──────────────────────── */
function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-72 h-72 rounded-full bg-[#00D9FF] opacity-[0.07] blur-[80px]" />
      </div>

      {/* 3D-perspective chat widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{ perspective: "1000px" }}
        className="relative"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transform: "rotateX(6deg) rotateY(-8deg)" }}
          className="w-72 rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-[0_40px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(0,217,255,0.1)] overflow-hidden"
        >
          {/* Widget header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#0A0A0A]">
            <div className="h-8 w-8 rounded-full bg-[#00D9FF]/15 border border-[#00D9FF]/30 flex items-center justify-center">
              <Bot className="h-4 w-4 text-[#00D9FF]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">AI Support Agent</p>
              <p className="text-[10px] text-[#888] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online · Ready to help
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-3 space-y-2.5">
            <WidgetMsg role="assistant" text="Hi! How can I help you today?" delay={0.6} />
            <WidgetMsg role="user" text="What's your enterprise pricing?" delay={1.0} />
            <WidgetMsg
              role="assistant"
              text="Our Business plan is $149/mo. It includes 10 agents, 5k conversations, and human handoff. Want me to book a demo?"
              delay={1.5}
            />
            <TypingIndicator delay={2.8} />
          </div>

          {/* Input */}
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-[#1C1C1C] bg-[#111] px-3 py-2">
            <span className="flex-1 text-[11px] text-[#444]">Ask anything…</span>
            <div className="h-6 w-6 rounded-lg bg-[#00D9FF]/20 flex items-center justify-center">
              <Send className="h-3 w-3 text-[#00D9FF]" />
            </div>
          </div>
        </motion.div>

        {/* Floating badges */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="absolute -left-16 top-10 flex items-center gap-2 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] px-3 py-2 shadow-xl"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-white font-medium">Lead captured</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.2, duration: 0.5 }}
          className="absolute -right-12 bottom-16 flex items-center gap-2 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] px-3 py-2 shadow-xl"
        >
          <span className="text-[11px] text-[#00D9FF] font-mono">+0.94</span>
          <span className="text-[11px] text-[#888]">intent score</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

function WidgetMsg({ role, text, delay }: { role: "user" | "assistant"; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
          role === "user"
            ? "bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-white rounded-tr-sm"
            : "bg-white/5 border border-white/8 text-[#ccc] rounded-tl-sm"
        }`}
      >
        {text}
      </div>
    </motion.div>
  );
}

function TypingIndicator({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="flex justify-start"
    >
      <div className="rounded-xl rounded-tl-sm border border-white/8 bg-white/5 px-3 py-2.5">
        <span className="flex gap-1 items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-[#888] animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#888] animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#888] animate-bounce [animation-delay:300ms]" />
        </span>
      </div>
    </motion.div>
  );
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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
      setMessages([{
        role: "assistant",
        content: `I've read ${data.pagesCrawled} page${data.pagesCrawled !== 1 ? "s" : ""} from **${data.domain}** and I'm ready to answer questions! What would you like to know?`,
      }]);
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
        body: JSON.stringify({ messages: [{ role: "user", content: msg }], context, messageCount: newCount - 1, domain: crawlData.domain }),
      });
      const data = await res.json();
      if (data.limitReached) {
        setMessages((prev) => [...prev, { role: "assistant", content: "You've reached the demo limit! Sign up for free to deploy your own AI agent with unlimited conversations." }]);
        setTimeout(() => setState("limit"), 1500);
        return;
      }
      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        if (data.messagesRemaining === 0) setTimeout(() => setState("limit"), 2000);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  }

  /* ── Active chat: full-page overlay (redesigned) ── */
  if (state === "ready" || state === "limit") {
    return (
      <>
        <div className="fixed inset-0 top-[65px] z-40 flex flex-col bg-black px-4 py-4">
          <div className="relative z-10 flex flex-col h-full w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2 text-sm text-[#888]">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>
                  Trained on <strong className="text-white">{crawlData?.domain}</strong>
                  {" · "}{crawlData?.pagesCrawled} page{crawlData?.pagesCrawled !== 1 ? "s" : ""} read
                </span>
              </div>
              <button
                onClick={() => { setState("idle"); setMessages([]); setMessageCount(0); setCrawlData(null); }}
                className="text-xs text-[#555] hover:text-white flex items-center gap-1 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Try another URL
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col flex-1 min-h-0 rounded-2xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden shadow-[0_0_60px_rgba(0,217,255,0.06)]"
            >
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1C1C1C] shrink-0">
                <div className="h-8 w-8 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-[#00D9FF]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{crawlData?.domain} AI Agent</p>
                  <p className="text-[10px] text-[#888] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE · DEMO MODE
                  </p>
                </div>
                <div className="ml-auto text-xs text-[#555]">
                  {Math.max(0, 5 - messageCount)} messages left
                </div>
              </div>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-[#00D9FF]" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-white"
                        : "rounded-tl-sm bg-white/5 border border-[#1C1C1C] text-[#ccc]"
                    }`}>
                      {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
                          : <span key={j}>{part}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start gap-2">
                    <div className="h-7 w-7 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-[#00D9FF]" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/5 border border-[#1C1C1C]">
                      <span className="flex gap-1 items-center h-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#888] animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#888] animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#888] animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 1 && !isTyping && (
                <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button key={q} onClick={() => handleSend(q)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#1C1C1C] text-[#888] hover:border-[#00D9FF]/40 hover:text-[#00D9FF] transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {state === "ready" && (
                <div className="border-t border-[#1C1C1C] px-4 py-3 flex items-center gap-3 shrink-0">
                  <input ref={inputRef} value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={`Ask anything about ${crawlData?.domain}...`}
                    disabled={isTyping}
                    className="flex-1 bg-transparent text-sm text-white placeholder-[#444] outline-none" />
                  <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
                    className="h-8 w-8 rounded-full bg-[#00D9FF]/20 border border-[#00D9FF]/30 flex items-center justify-center disabled:opacity-30 hover:bg-[#00D9FF]/30 transition-all">
                    <Send className="h-3.5 w-3.5 text-[#00D9FF]" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {state === "limit" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-md rounded-2xl border border-[#1C1C1C] bg-[#0A0A0A] p-8 text-center shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-[#00D9FF]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Your AI just answered 5 questions!</h3>
                <p className="text-[#888] text-sm mb-1">from <span className="text-[#00D9FF] font-medium">{crawlData?.domain}</span></p>
                <p className="text-[#555] text-sm mb-8">Sign up to deploy this AI agent on your site, remove limits, and unlock all features.</p>
                <div className="space-y-3">
                  <Link href="/login" className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#00D9FF]/30 bg-[#00D9FF]/10 py-3.5 text-sm font-semibold text-white hover:bg-[#00D9FF]/20 transition-all">
                    <Sparkles className="h-4 w-4 text-[#00D9FF]" /> Create free account — no credit card
                  </Link>
                  <button onClick={() => setState("ready")} className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#1C1C1C] py-3 text-sm text-[#888] hover:text-white hover:border-[#333] transition-all">
                    Continue exploring demo <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-6 space-y-2 text-left">
                  {["Unlimited conversations", "Custom branding & colors", "Lead capture & analytics", "Human handoff & inbox"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-[#888]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{f}
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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
      {/* Subtle dot grid */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-100" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left column */}
          <div className="flex flex-col items-start">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
              Agentic Support Platform
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-[64px] font-display font-bold tracking-tight text-white leading-[1.05] mb-6"
            >
              The AI Agent That Works.{" "}
              <span className="text-[#888]">And Knows When to Step Aside.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-[#888] leading-relaxed mb-10 max-w-lg"
            >
              Train it on your content. Deploy in 60 seconds. It handles support,
              captures leads, books demos — and hands off to a human the moment
              it matters.
            </motion.p>

            {/* URL Input */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full max-w-lg mb-4"
            >
              {state === "crawling" ? (
                <CrawlingState url={url} crawlStep={crawlStep} />
              ) : (
                <div className="flex rounded-2xl border border-[#1C1C1C] bg-[#0A0A0A] p-1.5 focus-within:border-[#00D9FF]/30 transition-all">
                  <div className="flex items-center pl-4 pr-2 text-[#444]">
                    <Globe className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleTrain()}
                    placeholder="yourwebsite.com"
                    className="flex-1 bg-transparent py-3 pr-2 text-white placeholder-[#444] outline-none text-sm"
                  />
                  <button
                    onClick={handleTrain}
                    disabled={!url.trim()}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Generate AI
                  </button>
                </div>
              )}
              {error && <p className="mt-2 text-sm text-red-400 px-2">{error}</p>}
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#555] mb-10"
            >
              {["No credit card required", "5 free demo messages", "Deploy in 60 seconds"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {t}
                </span>
              ))}
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {["bg-rose-500","bg-amber-500","bg-emerald-500","bg-sky-500","bg-violet-500"].map((c, i) => (
                  <div key={i} className={`h-7 w-7 rounded-full ${c} border-2 border-black`} />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-[#555]">Trusted by 2,400+ companies</p>
              </div>
            </motion.div>
          </div>

          {/* Right column — 3D Widget Visual */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex items-center justify-center h-[520px]"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CrawlingState({ url, crawlStep }: { url: string; crawlStep: number }) {
  return (
    <div className="rounded-2xl border border-[#1C1C1C] bg-[#0A0A0A] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative h-10 w-10 shrink-0">
          <div className="absolute inset-0 rounded-full border border-[#1C1C1C] animate-spin-slow" />
          <div className="absolute inset-0 rounded-full border-t border-[#00D9FF] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe className="h-4 w-4 text-[#00D9FF]" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            Scanning{" "}
            <span className="text-[#00D9FF]">{url.replace(/^https?:\/\//, "").split("/")[0]}</span>
          </p>
          <AnimatePresence mode="wait">
            <motion.p key={crawlStep}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="text-xs text-[#888] mt-0.5">
              {CRAWL_STEPS[crawlStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex gap-1.5">
        {CRAWL_STEPS.map((_, i) => (
          <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
            i <= crawlStep ? "bg-[#00D9FF]" : "bg-[#1C1C1C]"
          }`} />
        ))}
      </div>
    </div>
  );
}
