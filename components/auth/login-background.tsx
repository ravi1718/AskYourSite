"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";

const LEFT_MESSAGES = [
  { role: "user", text: "What are your pricing plans?" },
  { role: "ai", text: "We have Starter at $20/mo, Pro at $69/mo, and Business at $149/mo. All include a 7-day free trial!" },
  { role: "user", text: "Do you support Shopify stores?" },
  { role: "ai", text: "Yes! Just add one script tag to your Shopify theme and your AI agent goes live instantly." },
  { role: "user", text: "How does the AI learn my content?" },
  { role: "ai", text: "Enter your website URL and we'll crawl your pages automatically — products, FAQs, pricing, all of it." },
];

const RIGHT_MESSAGES = [
  { role: "user", text: "Can I book a demo call?" },
  { role: "ai", text: "Absolutely! Here's a booking calendar for you. Pick any time that works best 📅" },
  { role: "user", text: "What integrations do you support?" },
  { role: "ai", text: "Slack, Calendly, Notion, Google Docs, Sheets, Zapier, HubSpot and more — all live now!" },
  { role: "user", text: "Is there a free plan?" },
  { role: "ai", text: "Every plan starts with a 7-day full-access trial. No credit card needed to get started." },
];

function FloatingChat({
  messages,
  side,
  offset,
}: {
  messages: typeof LEFT_MESSAGES;
  side: "left" | "right";
  offset: number;
}) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const t = setInterval(() => {
      setVisibleCount((c) => (c >= messages.length ? 1 : c + 1));
    }, 2800);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div
      className={`absolute top-${offset} ${side === "left" ? "left-4 lg:left-12" : "right-4 lg:right-12"} w-56 lg:w-64 space-y-2 pointer-events-none`}
      style={{ top: `${offset}px` }}
    >
      <AnimatePresence>
        {messages.slice(0, visibleCount).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-1.5"}`}
          >
            {msg.role === "ai" && (
              <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3 w-3 text-violet-400" />
              </div>
            )}
            <div
              className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed max-w-[85%] ${
                msg.role === "user"
                  ? "rounded-tr-sm bg-violet-600/20 border border-violet-500/20 text-violet-200"
                  : "rounded-tl-sm bg-white/5 border border-white/8 text-slate-400"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[150px]" />

      {/* Floating chat conversations */}
      <FloatingChat messages={LEFT_MESSAGES} side="left" offset={120} />
      <FloatingChat messages={RIGHT_MESSAGES} side="right" offset={200} />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
