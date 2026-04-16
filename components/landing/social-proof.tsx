"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "AskYourSite handles 90% of our support tickets automatically. Our team only sees the conversations that matter — everything else is resolved before a human even looks at it.",
    name: "Sarah K.",
    role: "Head of Customer Experience",
    company: "Acme Commerce",
    avatar: "SK",
  },
  {
    quote: "We deployed in 45 minutes. Within the first week, our AI had answered over 1,200 questions. Lead capture alone paid for the subscription in the first month.",
    name: "Marcus T.",
    role: "Founder",
    company: "LaunchStack",
    avatar: "MT",
  },
  {
    quote: "The human handoff feature is what sold us. When a visitor is frustrated, the AI knows to step aside and we get a full context view. It's genuinely thoughtful design.",
    name: "Priya N.",
    role: "VP of Support",
    company: "DevTools Inc.",
    avatar: "PN",
  },
];

export function SocialProof() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section className="py-24 bg-black border-b border-[#1C1C1C]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Top statement */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
            Customers
          </div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight leading-tight">
            Over 2,400 companies answer customer questions 24/7 — without hiring another support rep.
          </h2>
        </div>

        {/* Cards */}
        <div ref={ref} className="grid lg:grid-cols-3 gap-px bg-[#1C1C1C]">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="bg-black p-8 hover:bg-[#0A0A0A] transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#888] text-base leading-relaxed mb-8">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#0A0A0A] border border-[#1C1C1C] flex items-center justify-center">
                  <span className="text-[11px] font-bold text-[#888]">{t.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-[11px] text-[#555]">{t.role} · {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
