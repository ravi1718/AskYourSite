"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

/* ─── Testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "We went from answering 50+ support emails a day to almost zero. AskYourSite handles 80% of them automatically. It paid for itself in week one.",
    name: "Sarah Chen",
    role: "Founder",
    company: "StyleDrop",
    avatar: "SC",
    avatarColor: "from-violet-500 to-purple-600",
  },
  {
    quote: "Our customers now get answers at 2 AM when we're asleep. The AI knows our product catalog better than some of our new sales reps. Absolutely wild.",
    name: "Marcus Reid",
    role: "Head of Growth",
    company: "Nexus SaaS",
    avatar: "MR",
    avatarColor: "from-blue-500 to-cyan-600",
  },
  {
    quote: "Setup literally took 4 minutes. I pasted the URL, hit train, and embedded the script. It was answering customer questions correctly within the hour.",
    name: "Priya Sharma",
    role: "E-commerce Director",
    company: "Botanica Store",
    avatar: "PS",
    avatarColor: "from-green-500 to-teal-600",
  },
];

const STATS = [
  { value: "10,000+", label: "Conversations per day" },
  { value: "500+", label: "Businesses using AskYourSite" },
  { value: "< 1s", label: "Average response time" },
  { value: "80%", label: "Questions answered automatically" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function SocialProof() {
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-yellow-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Trusted by businesses
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-4">
            Growing businesses love AskYourSite
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            From solo founders to growing SaaS teams — they all use AI to answer faster.
          </p>
        </div>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-center"
            >
              <p className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 flex flex-col cursor-default"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array(5).fill(null).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-slate-300 leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-xs font-bold text-white`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role} · {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust bar */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center text-xs text-slate-600"
        >
          ★★★★★ Rated 4.9/5 by customers · No credit card required to start
        </motion.p>
      </div>
    </section>
  );
}
