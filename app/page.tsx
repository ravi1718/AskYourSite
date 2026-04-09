"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HeroSection } from "@/components/landing/hero-section";
import { LiveDemoChat } from "@/components/landing/live-demo-chat";
import { BentoFeatures } from "@/components/landing/bento-features";
import { StickyFeatures } from "@/components/landing/sticky-features";
import { IntegrationsShowcase } from "@/components/landing/integrations-showcase";
import { SocialProof } from "@/components/landing/social-proof";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FinalCTA } from "@/components/landing/final-cta";
import {
  CheckCircle2,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/* ─── Navbar ─────────────────────────────────────────────── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Integrations", href: "#integrations" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "/docs" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#0D0D1A]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="AskYourSite" width={32} height={32} className="rounded-lg" />
          <span className="font-display text-base font-bold text-white tracking-tight">AskYourSite</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">
            Log in
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-violet-500 hover:to-blue-500 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/6 bg-[#0D0D1A]/95 backdrop-blur-xl px-4 py-6 space-y-4">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-slate-400 hover:text-white py-2 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-semibold text-white"
          >
            <Sparkles className="h-4 w-4" />
            Get Started Free
          </Link>
        </div>
      )}
    </header>
  );
}

/* ─── Pricing Section ────────────────────────────────────── */
function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "$20",
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
      popular: false,
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
        "Image-based product search",
        "Slack, Calendly, Notion integrations",
      ],
      popular: true,
    },
    {
      name: "Business",
      price: "$149",
      period: "/mo",
      desc: "For scale & teams",
      features: [
        "10 chatbots",
        "5,000 conversations / mo",
        "~500 pages training",
        "Image-based product search",
        "Advanced analytics + insights",
        "Lead capture + CSV export",
        "Custom AI persona & tone",
        "Priority support + onboarding",
        "API access (coming soon)",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-400 text-lg">7-day free trial · No credit card required</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 flex flex-col gap-6 transition-all ${
                plan.popular
                  ? "border border-violet-500/50 bg-gradient-to-b from-violet-900/20 to-transparent shadow-[0_0_40px_rgba(139,92,246,0.15)] scale-[1.02]"
                  : "border border-white/8 bg-white/[0.02]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-1 text-xs font-bold text-white">
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
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          No credit card required to start · Cancel anytime · Secure payments via Dodo Payments
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0A0A10] px-4 py-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Image src="/logo.png" alt="AskYourSite" width={28} height={28} className="rounded-lg" />
            <span className="font-display text-sm font-bold text-white">AskYourSite</span>
          </Link>
          <p className="text-xs text-slate-500 leading-relaxed mb-5">
            Turn any website into an AI-powered sales and support agent. No code required.
          </p>
          <div className="flex gap-3">
            {[
              { icon: TwitterIcon, href: "#" },
              { icon: LinkedinIcon, href: "#" },
              { icon: GithubIcon, href: "#" },
            ].map(({ icon: Icon, href }) => (
              <a
                key={href}
                href={href}
                className="h-8 w-8 rounded-lg border border-white/8 bg-white/3 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        {[
          {
            title: "Product",
            links: [
              { label: "Features", href: "#features" },
              { label: "Integrations", href: "#integrations" },
              { label: "Pricing", href: "#pricing" },
              { label: "Changelog", href: "#" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Docs", href: "/docs" },
              { label: "Support", href: "#" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Cookie Policy", href: "#" },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold text-white mb-4 uppercase tracking-widest">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-600">© 2026 AskYourSite. All rights reserved.</p>
        <p className="text-xs text-slate-700">Made with ❤️ for businesses everywhere</p>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] text-white">
      <Navbar />

      {/* Hero with interactive URL demo */}
      <HeroSection />

      {/* Animated live demo chat */}
      <div id="live-demo">
        <LiveDemoChat />
      </div>

      {/* Bento grid features */}
      <div id="features">
        <BentoFeatures />
      </div>

      {/* How it works */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* Sticky scroll features */}
      <StickyFeatures />

      {/* Integrations showcase */}
      <div id="integrations">
        <IntegrationsShowcase />
      </div>

      {/* Social proof */}
      <SocialProof />

      {/* Pricing */}
      <PricingSection />

      {/* Final CTA */}
      <FinalCTA />

      <Footer />
    </div>
  );
}
