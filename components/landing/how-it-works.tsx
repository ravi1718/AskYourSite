"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const STEPS = [
  {
    num: "01",
    title: "Connect",
    desc: "Paste your URL or sync Notion, Google Docs, Airtable, or HubSpot. Your AI reads every page, doc, and table — automatically.",
    detail: "Website · PDF · Notion · Google Docs · HubSpot · Airtable",
  },
  {
    num: "02",
    title: "Configure",
    desc: "Set your agent's tone, appearance, triggers, and integrations. Define what it does when a visitor is frustrated, buying, or booking.",
    detail: "Agent mode · Custom branding · Trigger rules · Webhooks",
  },
  {
    num: "03",
    title: "Deploy",
    desc: "Add one script tag to your site. Your AI agent goes live in under 60 seconds on any platform — Webflow, Shopify, WordPress, or raw HTML.",
    detail: "One script tag · Any platform · No plugins needed",
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section id="how-it-works" className="py-24 bg-black border-b border-[#1C1C1C]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
            How It Works
          </div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight">
            From zero to AI agent in three steps.
          </h2>
        </div>

        {/* Steps */}
        <div ref={ref} className="grid lg:grid-cols-3 gap-0 relative">
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-8 left-[16.66%] right-[16.66%] h-px">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
              style={{ transformOrigin: "left center" }}
              className="h-px bg-[#1C1C1C]"
            />
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="relative px-8 lg:px-10 py-8 border-b lg:border-b-0 lg:border-r border-[#1C1C1C] last:border-0"
            >
              {/* Giant decorative number */}
              <div
                className="absolute -top-6 left-8 lg:left-10 font-display font-bold text-[120px] leading-none select-none pointer-events-none"
                style={{ color: "rgba(255,255,255,0.03)" }}
              >
                {step.num}
              </div>

              {/* Step number dot */}
              <div className="relative z-10 mb-6 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-[#888]">{step.num}</span>
                </div>
                <div className="flex-1 h-px bg-[#1C1C1C] lg:hidden" />
              </div>

              <h3 className="relative z-10 text-2xl font-display font-bold text-white mb-3">
                {step.title}
              </h3>
              <p className="relative z-10 text-[#888] text-base leading-relaxed mb-4">
                {step.desc}
              </p>
              <p className="relative z-10 text-[11px] font-mono text-[#444] tracking-wide">
                {step.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
