"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsBar } from "@/components/landing/stats-bar";
import { FeatureMarquee } from "@/components/landing/feature-marquee";
import { TabbedDemo } from "@/components/landing/tabbed-demo";
import { StickyFeatures } from "@/components/landing/sticky-features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { IntegrationsShowcase } from "@/components/landing/integrations-showcase";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { SocialProof } from "@/components/landing/social-proof";
import { FinalCTA } from "@/components/landing/final-cta";
import { CheckCircle2, Menu, X } from "lucide-react";

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Integrations", href: "#integrations" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Setup Guide", href: "/setup" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 border-b transition-all duration-300 ${
      scrolled ? "border-[#1C1C1C] bg-black/90 backdrop-blur-xl" : "border-transparent bg-transparent"
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="AskYourSite" width={30} height={30} className="rounded-lg" />
          <span className="font-display text-base font-bold text-white tracking-tight">AskYourSite</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.label} href={l.href}
              className="text-sm text-[#888] hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#888] hover:text-white transition-colors px-3 py-2">
            Log in
          </Link>
          <Link href="/login"
            className="rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-2 text-sm font-semibold text-white hover:border-[#333] hover:bg-[#111] transition-all">
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-[#888] hover:text-white transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#1C1C1C] bg-black px-6 py-6 space-y-4">
          {links.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
              className="block text-sm text-[#888] hover:text-white py-2 transition-colors">
              {l.label}
            </Link>
          ))}
          <Link href="/login"
            className="flex items-center justify-center w-full rounded-xl border border-[#1C1C1C] py-3 text-sm font-semibold text-white">
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
        "1 AI agent",
        "200 conversations / mo",
        "~50 pages training",
        "Basic widget customization",
        "Analytics dashboard",
        "Unanswered question queue",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "$69",
      period: "/mo",
      desc: "For growing businesses",
      features: [
        "3 AI agents",
        "1,000 conversations / mo",
        "~200 pages training",
        "Full widget customization",
        "Lead capture in chat",
        "Remove branding",
        "Image search",
        "Slack, Calendly, Notion",
        "Agent mode + webhooks",
      ],
      popular: true,
    },
    {
      name: "Business",
      price: "$149",
      period: "/mo",
      desc: "For scale & teams",
      features: [
        "10 AI agents",
        "5,000 conversations / mo",
        "~500 pages training",
        "Human handoff + inbox",
        "Lead capture + CSV export",
        "All integrations",
        "Team workspace",
        "Custom AI persona",
        "Priority support",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-black border-b border-[#1C1C1C]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
            Pricing
          </div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight mb-3">
            Simple, transparent pricing.
          </h2>
          <p className="text-[#888] text-lg">7-day free trial · No credit card required · Cancel anytime</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#1C1C1C]">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`relative flex flex-col p-8 ${
                plan.popular ? "bg-[#0A0A0A]" : "bg-black"
              }`}>
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 h-px bg-[#00D9FF]/50" />
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#888] uppercase tracking-widest">{plan.name}</h3>
                  {plan.popular && (
                    <span className="text-[10px] font-semibold text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-[#555]">{plan.period}</span>
                </div>
                <p className="text-sm text-[#555]">{plan.desc}</p>
              </div>

              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#888]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00D9FF]" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/login"
                className={`w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-white text-black hover:bg-white/90"
                    : "border border-[#1C1C1C] text-white hover:border-[#333] hover:bg-[#0A0A0A]"
                }`}>
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[#444]">
          No credit card required · Cancel anytime · Secure payments via Dodo Payments
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-[#1C1C1C] bg-black px-6 py-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Image src="/logo.png" alt="AskYourSite" width={26} height={26} className="rounded-lg" />
            <span className="font-display text-sm font-bold text-white">AskYourSite</span>
          </Link>
          <p className="text-xs text-[#444] leading-relaxed mb-5">
            AI-powered support & sales, built for the modern web.
          </p>
          <div className="flex gap-2.5">
            {[
              { icon: TwitterIcon, href: "#" },
              { icon: LinkedinIcon, href: "#" },
              { icon: GithubIcon, href: "#" },
            ].map(({ icon: Icon, href }, i) => (
              <a key={i} href={href}
                className="h-8 w-8 rounded-lg border border-[#1C1C1C] flex items-center justify-center text-[#444] hover:text-[#888] hover:border-[#333] transition-all">
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

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
              { label: "Contact", href: "/contact" },
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
            <p className="text-[11px] font-semibold text-[#888] mb-4 uppercase tracking-widest">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs text-[#444] hover:text-[#888] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#333]">© 2026 AskYourSite. All rights reserved.</p>
        <p className="text-xs text-[#333]">Built for builders.</p>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Stats bar */}
      <StatsBar />

      {/* 3. Feature marquee */}
      <FeatureMarquee />

      {/* 4. Tabbed product demo */}
      <TabbedDemo />

      {/* 5. Deep-dive sticky feature panels */}
      <StickyFeatures />

      {/* 6. How it works */}
      <HowItWorks />

      {/* 7. Integrations 3×3 grid */}
      <IntegrationsShowcase />

      {/* 8. All features grid */}
      <FeatureGrid />

      {/* 9. Social proof */}
      <SocialProof />

      {/* 10. Pricing */}
      <PricingSection />

      {/* 11. Final CTA */}
      <FinalCTA />

      <Footer />
    </div>
  );
}
