"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Sparkles, Code2, ArrowRight } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    number: "01",
    icon: Globe,
    iconColor: "text-blue-400",
    iconBg: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
    title: "Enter your website",
    desc: "Paste your URL and we'll automatically discover and read your pages — product info, FAQs, pricing, everything.",
    badge: "Takes 30 seconds",
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    number: "02",
    icon: Sparkles,
    iconColor: "text-violet-400",
    iconBg: "from-violet-500/20 to-violet-600/10 border-violet-500/20",
    title: "AI learns your content",
    desc: "Our AI reads, understands, and indexes your content. It learns your products, tone, pricing, and FAQs — then becomes your expert.",
    badge: "Powered by Gemini",
    badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    number: "03",
    icon: Code2,
    iconColor: "text-green-400",
    iconBg: "from-green-500/20 to-green-600/10 border-green-500/20",
    title: "Add to your site",
    desc: "Copy one script tag and paste it into your site. Your AI agent goes live instantly — no developers required.",
    badge: "One line of code",
    badgeColor: "text-green-400 bg-green-500/10 border-green-500/20",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HowItWorks() {
  return (
    <section className="relative py-24 px-4">
      {/* Subtle divider glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-violet-500/30" />

      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-4">
            Up and running in 3 steps
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No developers, no complex setup. Just your website URL and 2 minutes of your time.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative"
        >
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-green-500/30" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="relative flex flex-col items-center lg:items-start text-center lg:text-left"
                >
                  {/* Step number + icon */}
                  <div className="relative mb-6">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br border flex items-center justify-center ${step.iconBg}`}>
                      <Icon className={`h-8 w-8 ${step.iconColor}`} />
                    </div>
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#0D0D1A] border border-white/10 text-[10px] font-bold text-slate-400 flex items-center justify-center">
                      {step.number}
                    </span>
                  </div>

                  {/* Arrow between steps (desktop) */}
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-7 -right-5 h-5 w-5 text-slate-700" />
                  )}

                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold mb-3 ${step.badgeColor}`}>
                    {step.badge}
                  </span>

                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-14 text-center"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-8 py-4 text-sm font-semibold text-white hover:from-violet-500 hover:to-blue-500 transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            <Sparkles className="h-4 w-4" />
            Start building for free
          </Link>
          <p className="mt-3 text-xs text-slate-600">7-day free trial · No credit card required</p>
        </motion.div>
      </div>
    </section>
  );
}
