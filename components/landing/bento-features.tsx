"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Zap, Globe, Code2, BarChart3, Palette, Clock, Shield } from "lucide-react";

/* ─── Animated chat messages for the large card ─────────── */
const CHAT_MESSAGES = [
  { role: "user", text: "What's your return policy?" },
  { role: "ai", text: "We offer a 30-day no-questions-asked return policy on all orders. Just email support@..." },
  { role: "user", text: "Do you ship internationally?" },
  { role: "ai", text: "Yes! We ship to 50+ countries. Standard shipping is $12, express is $25 for most destinations." },
  { role: "user", text: "Can I get a bulk discount?" },
  { role: "ai", text: "Absolutely! For orders over 10 units we offer 15% off. For 50+ units, reach out for custom pricing." },
];

function AnimatedChatPreview() {
  const [visibleCount, setVisibleCount] = useState(2);

  useEffect(() => {
    const t = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= CHAT_MESSAGES.length) return 2;
        return c + 1;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-2.5 overflow-hidden h-full">
      {CHAT_MESSAGES.slice(0, visibleCount).map((msg, i) => (
        <motion.div
          key={`${i}-${visibleCount}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}
        >
          {msg.role === "ai" && (
            <div className="h-6 w-6 rounded-full bg-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-3.5 w-3.5 text-violet-400" />
            </div>
          )}
          <div
            className={`rounded-xl px-3 py-1.5 text-xs max-w-[80%] leading-relaxed ${
              msg.role === "user"
                ? "bg-violet-600/30 border border-violet-500/30 text-white rounded-tr-sm"
                : "bg-white/5 border border-white/8 text-slate-300 rounded-tl-sm"
            }`}
          >
            {msg.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Bento card ─────────────────────────────────────────── */
interface BentoCardProps {
  className?: string;
  children: React.ReactNode;
  gradient?: boolean;
}

function Card({ className = "", children, gradient }: BentoCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl border border-white/8 overflow-hidden group cursor-default ${
        gradient
          ? "bg-gradient-to-br from-violet-900/30 to-blue-900/20"
          : "bg-white/[0.03]"
      } ${className}`}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: "inset 0 0 40px rgba(139,92,246,0.08)" }} />
      {children}
    </motion.div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ─── Main Component ─────────────────────────────────────── */
export function BentoFeatures() {
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-green-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Everything You Need
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-4">
            Built for results, not just demos
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Every feature is designed to turn website visitors into customers.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Large card — live chat preview (col-span-2) */}
          <motion.div variants={cardVariants} className="lg:col-span-2">
            <Card gradient className="p-6 h-72">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Live AI Conversations</p>
                  <p className="text-[10px] text-slate-500">Your agent answers 24/7</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  ONLINE
                </div>
              </div>
              <AnimatedChatPreview />
            </Card>
          </motion.div>

          {/* Tall card — 24/7 Support */}
          <motion.div variants={cardVariants} className="sm:row-span-2 lg:row-span-1">
            <Card className="p-6 h-full min-h-72 flex flex-col">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center mb-5">
                <Clock className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">24/7 AI Support</h3>
              <p className="text-sm text-slate-400 leading-relaxed flex-1">
                Your AI agent never sleeps. Answer customer questions at 3 AM, on weekends, during holidays — automatically.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Mon", "Sat", "Sun"].map((d) => (
                  <div key={d} className="rounded-lg border border-green-500/20 bg-green-500/5 py-2 text-center">
                    <p className="text-[9px] text-slate-500 mb-0.5">{d}</p>
                    <p className="text-xs font-bold text-green-400">✓</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Small card — Train on website */}
          <motion.div variants={cardVariants}>
            <Card className="p-5 h-40">
              <Globe className="h-7 w-7 text-blue-400 mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1.5">Train on your website</h3>
              <p className="text-xs text-slate-500">
                Enter your URL. AI reads your content in minutes, no manual uploads needed.
              </p>
            </Card>
          </motion.div>

          {/* Small card — Instant answers */}
          <motion.div variants={cardVariants}>
            <Card className="p-5 h-40" gradient>
              <Zap className="h-7 w-7 text-yellow-400 mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1.5">Instant answers</h3>
              <p className="text-xs text-slate-500">
                Responses under 1 second. No wait times, no loading spinners for your customers.
              </p>
            </Card>
          </motion.div>

          {/* Small card — No coding */}
          <motion.div variants={cardVariants}>
            <Card className="p-5 h-40">
              <Code2 className="h-7 w-7 text-green-400 mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1.5">No coding required</h3>
              <p className="text-xs text-slate-500">
                One script tag. Copy, paste, done. Works on any website platform.
              </p>
            </Card>
          </motion.div>

          {/* Small card — Custom branding */}
          <motion.div variants={cardVariants}>
            <Card className="p-5 h-40">
              <Palette className="h-7 w-7 text-pink-400 mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1.5">Custom branding</h3>
              <p className="text-xs text-slate-500">
                Match your brand colors, logo, and name. Feels native to your website.
              </p>
            </Card>
          </motion.div>

          {/* Small card — Analytics */}
          <motion.div variants={cardVariants}>
            <Card className="p-5 h-40" gradient>
              <BarChart3 className="h-7 w-7 text-violet-400 mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1.5">Built-in analytics</h3>
              <p className="text-xs text-slate-500">
                See top questions, unanswered gaps, and lead capture stats in one dashboard.
              </p>
            </Card>
          </motion.div>

          {/* Small card — Security */}
          <motion.div variants={cardVariants}>
            <Card className="p-5 h-40">
              <Shield className="h-7 w-7 text-teal-400 mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1.5">Easy integration</h3>
              <p className="text-xs text-slate-500">
                Slack, Calendly, Notion, Google Docs — connect your stack in one click.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
