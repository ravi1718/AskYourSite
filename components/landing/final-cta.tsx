"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
      {/* Very subtle cyan tinge — not a gradient, just a hint */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[300px] rounded-full bg-[#00D9FF] opacity-[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-10">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
          Get Started
        </div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-6xl font-display font-bold text-white tracking-tight leading-[1.05] mb-6"
        >
          Start building your AI agent in under 60 seconds.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[#888] text-lg leading-relaxed mb-10"
        >
          No credit card. No setup fees. Train on your website and deploy today.
        </motion.p>

        {/* Feature bullets */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#555] mb-12"
        >
          {[
            "5 free demo messages",
            "Deploy in 60 seconds",
            "No credit card required",
            "Cancel anytime",
          ].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {f}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-black hover:bg-white/90 transition-all"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#1C1C1C] px-8 py-4 text-sm font-semibold text-[#888] hover:text-white hover:border-[#333] transition-all"
          >
            Book a Demo
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
