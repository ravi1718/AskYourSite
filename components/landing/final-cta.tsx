"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
  "7-day free trial",
  "No credit card required",
  "Set up in under 5 minutes",
  "Cancel anytime",
];

export function FinalCTA() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px] animate-breathe" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-blue-600/6 blur-[80px] animate-breathe [animation-delay:2s]" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-400 mb-6">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Ready to launch?
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-white tracking-tight mb-6 leading-[1.1]">
            Start building your{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              AI agent today
            </span>
          </h2>

          {/* Subtext */}
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Join 500+ businesses that never miss a customer question.
            Your AI agent is ready in minutes.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-8 py-4 text-sm font-semibold text-white hover:from-violet-500 hover:to-blue-500 transition-all shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.4)]"
            >
              <Sparkles className="h-4 w-4" />
              Get Started for Free
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-4 text-sm font-semibold text-slate-300 hover:text-white hover:border-white/20 transition-all"
            >
              Watch demo first
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {BENEFITS.map((b) => (
              <span key={b} className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                {b}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
