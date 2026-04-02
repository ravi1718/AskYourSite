"use client";

import React, { useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import {
  ArrowRight,
  Bot,
  Zap,
  Globe,
  MessageSquare,
  CheckCircle2,
  Code2,
  Image,
  Palette,
  BarChart3,
  Sparkles,
  Twitter,
  Github,
  Menu,
  X,
  ShoppingBag,
  Layers,
  Briefcase,
  ChevronDown,
  User,
  Building2,
  Store,
  Users,
  Stethoscope,
  BookOpen,
  Linkedin,
} from "lucide-react";

/* ─── Small reusable helpers ─────────────────────────── */

function GlassNode({
  children,
  className = "",
  nodeRef,
}: {
  children: React.ReactNode;
  className?: string;
  nodeRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={nodeRef}
      className={`relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      {children}
    </span>
  );
}

/* ─── Integration Hub Diagram ────────────────────────── */

function IntegrationHub() {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const node1Ref = useRef<HTMLDivElement>(null);
  const node2Ref = useRef<HTMLDivElement>(null);
  const node3Ref = useRef<HTMLDivElement>(null);
  const node4Ref = useRef<HTMLDivElement>(null);
  const node5Ref = useRef<HTMLDivElement>(null);
  const node6Ref = useRef<HTMLDivElement>(null);

  const nodes = [
    { ref: node1Ref, label: "Drive", color: "#4285f4", icon: "🗂️", delay: 0 },
    { ref: node2Ref, label: "Docs", color: "#34a853", icon: "📄", delay: 0.5 },
    { ref: node3Ref, label: "WhatsApp", color: "#25d366", icon: "💬", delay: 1 },
    { ref: node4Ref, label: "Notion", color: "#ffffff", icon: "📝", delay: 1.5 },
    { ref: node5Ref, label: "Zapier", color: "#ff4a00", icon: "⚡", delay: 2 },
    { ref: node6Ref, label: "Messenger", color: "#0084ff", icon: "💭", delay: 2.5 },
  ];

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-lg h-80 flex items-center justify-center"
    >
      {/* Animated beams */}
      {nodes.map((n, i) => (
        <AnimatedBeam
          key={i}
          containerRef={containerRef}
          fromRef={n.ref}
          toRef={centerRef}
          duration={3 + i * 0.4}
          delay={n.delay}
          curvature={i % 2 === 0 ? 30 : -30}
        />
      ))}

      {/* Left column nodes */}
      <div className="absolute left-0 flex flex-col gap-6 items-start">
        {nodes.slice(0, 3).map((n, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <GlassNode nodeRef={n.ref} className="hover:border-white/30 transition-colors">
              <span className="text-xl">{n.icon}</span>
            </GlassNode>
            <span className="text-[10px] text-slate-500">{n.label}</span>
          </div>
        ))}
      </div>

      {/* Center hub */}
      <div className="relative flex items-center justify-center z-10">
        {/* Pulse rings */}
        <div className="absolute h-20 w-20 rounded-full bg-primary/20 animate-pulse-ring" />
        <div className="absolute h-20 w-20 rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: "1s" }} />
        {/* Center node */}
        <div
          ref={centerRef}
          className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/50 bg-gradient-to-br from-primary/30 to-secondary/30 backdrop-blur-xl shadow-glow animate-glow-pulse"
        >
          <Bot className="h-9 w-9 text-white" />
        </div>
      </div>

      {/* Right column nodes */}
      <div className="absolute right-0 flex flex-col gap-6 items-end">
        {nodes.slice(3).map((n, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <GlassNode nodeRef={n.ref} className="hover:border-white/30 transition-colors">
              <span className="text-xl">{n.icon}</span>
            </GlassNode>
            <span className="text-[10px] text-slate-500">{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Bento Feature Cards ─────────────────────────────── */

function FeatureCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-white/[0.05] hover:shadow-[0_8px_40px_rgba(59,130,246,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Testimonial Card ────────────────────────────────── */

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="text-sm font-semibold text-white pr-4">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-40" : "max-h-0"}`}
      >
        <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────── */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <main className="relative overflow-x-hidden bg-background text-text min-h-screen">

      {/* ── Background glows ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-pink-500/5 blur-[120px]" />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
      </div>

      {/* ═══════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-background/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <NextImage src="/logo.png" alt="AskYourSite" width={44} height={44} className="rounded-xl" />
            <span className="font-display text-lg font-bold tracking-tight text-white">AskYourSite</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg hover:scale-105 transition-all active:scale-95"
            >
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile menu btn */}
          <button
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-background/95 px-6 py-4 flex flex-col gap-4">
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white">How it works</a>
            <a href="#features" className="text-sm text-slate-400 hover:text-white">Features</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white">Pricing</a>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white">Log in</Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-2 text-sm font-semibold text-white">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 pt-24 pb-16 text-center lg:px-10">

        {/* Badge */}
        <div className="animate-fade-up mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Zap className="h-3 w-3 fill-current" />
            AskYourSite is now live
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-75 max-w-4xl font-display text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
          Turn Your Website Into an{" "}
          <span className="gradient-text-animated">AI Agent</span>
        </h1>

        {/* Subtext */}
        <p className="animate-fade-up delay-150 mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          Train AI on your website and let visitors ask questions, discover products, and
          interact with your business instantly — no code required.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-200 mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-ink shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] hover:scale-105 transition-all active:scale-95"
          >
            Start for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:border-white/20 hover:bg-white/8 transition-all">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Watch Demo
          </button>
        </div>

        {/* Trust line */}
        <p className="animate-fade-up delay-300 mt-6 text-xs text-slate-600">
          No credit card required · Setup in 2 minutes
        </p>

        {/* Integration Hub */}
        <div className="animate-fade-up delay-500 mt-20 w-full">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-600 mb-8">
            Connects with your existing tools
          </p>
          <div className="relative rounded-3xl border border-white/8 bg-white/[0.02] p-8 backdrop-blur-sm shadow-halo mx-auto max-w-2xl">
            <IntegrationHub />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHY ASKYOURSITE
      ═══════════════════════════════════════ */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                color: "text-amber-400 bg-amber-500/15",
                title: "Zero code required",
                desc: "Paste one script tag and your AI agent goes live — no developers needed.",
              },
              {
                icon: Bot,
                color: "text-primary bg-primary/15",
                title: "Trained on your content",
                desc: "Only answers based on your actual website — no hallucinations, no guessing.",
              },
              {
                icon: Globe,
                color: "text-emerald-400 bg-emerald-500/15",
                title: "Up and running in minutes",
                desc: "Enter your URL, wait for training to finish, embed the widget — done.",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES BENTO GRID
      ═══════════════════════════════════════ */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-28 lg:px-10">
        <div className="text-center mb-16">
          <SectionBadge>Features</SectionBadge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to deploy AI
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            From instant setup to advanced analytics — built for modern businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Large card 1 — AI Chat */}
          <FeatureCard className="lg:col-span-2 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Instant AI Answers</h3>
                <p className="text-sm text-slate-400 mt-1">Your AI agent answers questions in real-time, trained on your exact website content.</p>
              </div>
            </div>
            {/* Mock chat */}
            <div className="rounded-xl border border-white/8 bg-background/60 p-4 space-y-3">
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-sm bg-primary/20 border border-primary/30 px-4 py-2 text-sm text-white max-w-[75%]">
                  What&apos;s your return policy?
                </div>
              </div>
              <div className="flex justify-start gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/8 px-4 py-2 text-sm text-slate-300 max-w-[75%]">
                  We offer a <strong className="text-white">30-day free return</strong> on all orders. Just visit your account portal to initiate a return — no questions asked.
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-slate-600">Typing...</span>
              </div>
            </div>
          </FeatureCard>

          {/* Card — Image Search */}
          <FeatureCard className="p-6 flex flex-col">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 mb-4">
              <Image className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white">Visual Product Search</h3>
            <p className="text-sm text-slate-400 mt-2 flex-1">Upload any image — the AI finds matching products from your catalog instantly.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["🖥️","👟","🎒"].map((e, i) => (
                <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-2xl hover:border-violet-500/50 transition-colors cursor-pointer">
                  {e}
                </div>
              ))}
            </div>
          </FeatureCard>

          {/* Card — Train in Minutes */}
          <FeatureCard className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white">Train in Minutes</h3>
            <p className="text-sm text-slate-400 mt-2">Just enter your URL — our crawler indexes your entire website automatically.</p>
            <div className="mt-4 space-y-2">
              {["Enter URL", "AI crawls site", "Deploy widget"].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <span className="text-sm text-slate-300">{step}</span>
                  {i < 2 && <div className="ml-auto h-px w-4 bg-white/10" />}
                </div>
              ))}
            </div>
          </FeatureCard>

          {/* Card — Custom Branding */}
          <FeatureCard className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 mb-4">
              <Palette className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white">Custom Branding</h3>
            <p className="text-sm text-slate-400 mt-2">Match your brand colors, fonts, and logo perfectly.</p>
            <div className="mt-4 flex gap-2">
              {["#3b82f6","#8b5cf6","#ec4899","#10b981","#f59e0b"].map((c, i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white/10 hover:scale-110 transition-transform cursor-pointer" style={{ background: c }} />
              ))}
            </div>
          </FeatureCard>

          {/* Card — Analytics */}
          <FeatureCard className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-4">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white">Analytics Dashboard</h3>
            <p className="text-sm text-slate-400 mt-2">Understand what visitors ask most and optimize your AI&apos;s performance.</p>
            {/* Mock bar chart */}
            <div className="mt-4 flex items-end gap-1.5 h-12">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-amber-500/60 to-amber-500/20"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </FeatureCard>

          {/* Large card 2 — Embed */}
          <FeatureCard className="lg:col-span-2 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Embed Anywhere</h3>
                <p className="text-sm text-slate-400 mt-1">One script tag. Works on any website, CMS, or e-commerce platform.</p>
              </div>
            </div>
            {/* Code snippet */}
            <div className="rounded-xl border border-white/8 bg-background/80 p-4 font-mono text-sm overflow-x-auto">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-slate-600">index.html</span>
              </div>
              <span className="text-slate-500">&lt;</span>
              <span className="text-blue-400">script</span>
              {" "}
              <span className="text-green-400">src</span>
              <span className="text-slate-500">=</span>
              <span className="text-amber-400">&quot;https://askyoursite.ai/embed.js&quot;</span>
              {" "}
              <span className="text-green-400">data-id</span>
              <span className="text-slate-500">=</span>
              <span className="text-amber-400">&quot;your-agent-id&quot;</span>
              <span className="text-slate-500">&gt;&lt;/</span>
              <span className="text-blue-400">script</span>
              <span className="text-slate-500">&gt;</span>
              <span className="animate-blink text-white ml-0.5">|</span>
            </div>
          </FeatureCard>

        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 border-y border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
          <div className="text-center mb-16">
            <SectionBadge>How it works</SectionBadge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Live in under 5 minutes
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulseLine" />

            {[
              { icon: Globe, title: "Enter your URL", desc: "Paste your website link and we handle the rest.", color: "from-blue-500 to-cyan-500" },
              { icon: Bot, title: "AI trains instantly", desc: "Our crawler indexes your content and builds a knowledge base.", color: "from-violet-500 to-purple-500" },
              { icon: Palette, title: "Customize agent", desc: "Set tone, branding, and configure your agent's personality.", color: "from-pink-500 to-rose-500" },
              { icon: Zap, title: "Deploy anywhere", desc: "Embed the widget with one script tag and go live.", color: "from-amber-500 to-orange-500" },
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                {/* Step number */}
                <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                  <step.icon className="h-8 w-8 text-white" />
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-white text-xs font-bold text-ink">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHO IT'S FOR
      ═══════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="text-center mb-10">
          <SectionBadge>Who it&apos;s for</SectionBadge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for every kind of builder
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            From solo makers to scaling teams — if you have a website, AskYourSite works for you.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              icon: User,
              label: "Solo Founders",
              tagline: "Look bigger, ship faster, handle support alone",
              color: "text-violet-400",
              bg: "bg-violet-500/10 border-violet-500/20",
            },
            {
              icon: Layers,
              label: "SaaS Companies",
              tagline: "Cut support tickets, automate onboarding Q&A",
              color: "text-primary",
              bg: "bg-primary/10 border-primary/20",
            },
            {
              icon: Store,
              label: "E-commerce Stores",
              tagline: "Product discovery, order help, 24/7 upsells",
              color: "text-pink-400",
              bg: "bg-pink-500/10 border-pink-500/20",
            },
            {
              icon: Building2,
              label: "Agencies",
              tagline: "Deploy AI assistants for every client site",
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
            },
            {
              icon: Stethoscope,
              label: "Service Businesses",
              tagline: "Clinics, law firms & consultants — answer enquiries instantly",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              icon: BookOpen,
              label: "Content Creators",
              tagline: "Monetize your knowledge, answer audience questions",
              color: "text-cyan-400",
              bg: "bg-cyan-500/10 border-cyan-500/20",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 rounded-2xl border p-5 backdrop-blur-sm transition-all hover:scale-[1.02] ${item.bg}`}
            >
              <div className={`mt-0.5 shrink-0 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          USE CASES
      ═══════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="text-center mb-12">
          <SectionBadge>Use Cases</SectionBadge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for your business
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            Whether you sell products, run a SaaS, or offer services — AskYourSite turns your website into a 24/7 AI assistant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ShoppingBag,
              color: "from-pink-500 to-rose-500",
              bg: "bg-pink-500/10",
              badge: "E-commerce",
              title: "Product discovery & support",
              desc: "Let shoppers describe what they're looking for — or upload a photo — and your AI finds the matching product instantly. Fewer emails, more sales.",
              points: ["Visual product search", "Stock & pricing answers", "Order & returns support"],
            },
            {
              icon: Layers,
              color: "from-primary to-secondary",
              bg: "bg-primary/10",
              badge: "SaaS & Tech",
              title: "Self-serve customer support",
              desc: "Answer pricing, documentation, and onboarding questions automatically so your team focuses on what matters, not repetitive tickets.",
              points: ["Docs & FAQ coverage", "Pricing plan guidance", "Onboarding assistance"],
            },
            {
              icon: Briefcase,
              color: "from-amber-500 to-orange-500",
              bg: "bg-amber-500/10",
              badge: "Service business",
              title: "Lead capture & qualification",
              desc: "Convert curious visitors into warm leads by answering their service questions instantly — even outside business hours.",
              points: ["Service scope answers", "Pricing enquiries", "Booking & contact flow"],
            },
          ].map((card, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:border-primary/25 hover:bg-white/[0.05] hover:shadow-[0_8px_40px_rgba(59,130,246,0.07)]"
            >
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} mb-5 shadow-lg`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <div className="mb-3">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${card.bg} text-slate-300 mb-2`}>
                  {card.badge}
                </span>
                <h3 className="text-base font-bold text-white">{card.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">{card.desc}</p>
              <ul className="space-y-2">
                {card.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FAQ
      ═══════════════════════════════════════ */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">
          <div className="text-center mb-12">
            <SectionBadge>FAQ</SectionBadge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Common questions
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <FAQItem
              question="How does training work?"
              answer="You enter your website URL and our crawler reads every page, then builds an AI knowledge base from your actual content. No manual data entry needed."
            />
            <FAQItem
              question="Does the AI make things up?"
              answer="No. The AI only answers based on what exists on your website. If a question falls outside that content, it says so honestly instead of guessing."
            />
            <FAQItem
              question="How long does setup take?"
              answer="Under 5 minutes for most websites. Enter your URL, wait for training to finish, copy the one-line script tag, and paste it into your site — done."
            />
            <FAQItem
              question="What websites does it work on?"
              answer="Any website that allows custom HTML — Shopify, WordPress, Webflow, Wix, or a custom-built site. If you can add a script tag, you can embed AskYourSite."
            />
            <FAQItem
              question="Can I customize the chat widget?"
              answer="Yes. You control the widget name, avatar, welcome message, colors, and behavior — so it matches your brand perfectly."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="Yes. Every plan starts with a 7-day free trial — no credit card required. After the trial you choose a plan to continue. Cancel anytime with no questions asked."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRICING
      ═══════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-6 py-28 lg:px-10">
        <div className="text-center mb-16">
          <SectionBadge>Pricing</SectionBadge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-slate-400">7-day free trial on Pro plan. No credit card required.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {[
            {
              name: "Starter",
              price: "$29",
              period: "/mo",
              desc: "Perfect to get started",
              features: [
                "1 chatbot",
                "200 conversations / mo",
                "~50 pages training",
                "Basic widget customization",
                "Unanswered question queue",
                "Analytics dashboard",
              ],
              cta: "Start free trial",
              popular: false,
              ctaStyle: "border border-white/10 bg-white/5 text-white hover:bg-white/10",
            },
            {
              name: "Pro",
              price: "$69",
              period: "/mo",
              desc: "For growing businesses",
              features: [
                "3 chatbots",
                "1,000 conversations / mo",
                "~200 pages training",
                "Full widget customization",
                "Analytics dashboard",
                "Lead capture in chat",
                'Remove "Powered by" branding',
                "Email support",
                "Image-based product search",
              ],
              cta: "Start free trial",
              popular: true,
              ctaStyle: "bg-white text-ink hover:bg-slate-100",
            },
            {
              name: "Business",
              price: "$149",
              period: "/mo",
              desc: "For scale & teams",
              features: [
                "10 chatbots",
                "5,000 conversations / mo",
                "Unlimited URL + doc training",
                "Image-based product search",
                "Advanced analytics + insights",
                "Lead capture + CSV export",
                "Custom AI persona & tone",
                "Priority support + onboarding",
                "API access (coming soon)",
              ],
              cta: "Start free trial",
              popular: false,
              ctaStyle: "border border-white/10 bg-white/5 text-white hover:bg-white/10",
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-7 flex flex-col gap-6 transition-all ${
                plan.popular
                  ? "border border-primary/60 bg-gradient-to-b from-primary/10 to-transparent shadow-glow scale-105"
                  : "border border-white/8 bg-white/[0.02]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1 text-xs font-bold text-white shadow-glow">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-base font-semibold text-slate-300">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">+ taxes applicable</p>
                <p className="mt-1 text-sm text-slate-500">{plan.desc}</p>
              </div>

              <ul className="flex flex-col gap-3 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`w-full rounded-full py-3 text-center text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          No credit card required to start · Cancel anytime · Secure payments via Dodo Payments
        </p>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA BANNER
      ═══════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-secondary/10 to-pink-500/10 p-12 text-center">
          {/* Background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.2),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" />

          <div className="relative">
            <Sparkles className="mx-auto h-10 w-10 text-primary mb-4 animate-breathe" />
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Ready to launch your AI Agent?
            </h2>
            <p className="mt-4 text-slate-400 max-w-lg mx-auto">
              Turn your website into a 24/7 AI agent. Set up in minutes, no code required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-ink shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-105 transition-all"
              >
                Start your free trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-xs text-slate-600">7-day free trial · No credit card · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/5 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5 mb-12">
            {/* Brand col */}
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <NextImage src="/logo.png" alt="AskYourSite" width={44} height={44} className="rounded-xl" />
                <span className="font-display text-lg font-bold text-white">AskYourSite</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs">
                Turn any website into a 24/7 AI sales and support agent. No code required.
              </p>
              <div className="flex gap-3 mt-5">
                <a href="https://x.com/ravitej_neeli" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 transition-colors">
                  <Twitter className="h-3.5 w-3.5" />
                </a>
                <a href="https://www.linkedin.com/in/ravitej-c-neeli-612877266/" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 transition-colors">
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Links */}
            {[
              { heading: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Changelog", href: "#" }, { label: "Roadmap", href: "#" }] },
              { heading: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }] },
              { heading: "Legal", links: [{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }, { label: "Security", href: "#" }, { label: "Cookies", href: "#" }] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">{col.heading}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <p>© 2026 AskYourSite. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
