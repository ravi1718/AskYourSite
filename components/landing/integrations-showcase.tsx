"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ArrowRight } from "lucide-react";

const INTEGRATIONS = [
  {
    name: "Slack",
    desc: "Real-time alerts for leads, buying intent, bookings, and unanswered questions to any channel.",
    tag: "Notifications",
    letter: "S",
    color: "#4a154b",
  },
  {
    name: "Calendly",
    desc: "In-chat booking with auto-confirmation. Visitors book demos without ever leaving the conversation.",
    tag: "Bookings",
    letter: "C",
    color: "#006bff",
  },
  {
    name: "Notion",
    desc: "Sync pages and databases as your AI's knowledge base. Stays updated every night, automatically.",
    tag: "Knowledge · Auto-sync",
    letter: "N",
    color: "#ffffff",
  },
  {
    name: "Google Docs",
    desc: "Connect Docs, Sheets, and Drive folders. Your AI reads and answers from live Google content.",
    tag: "Knowledge · Auto-sync",
    letter: "G",
    color: "#4285f4",
  },
  {
    name: "Airtable",
    desc: "Use Airtable bases as structured knowledge sources. Tables become searchable AI context.",
    tag: "Knowledge · Auto-sync",
    letter: "A",
    color: "#f94f35",
  },
  {
    name: "HubSpot",
    desc: "Sync your HubSpot knowledge base and blog directly into your AI agent's training data.",
    tag: "Knowledge · Auto-sync",
    letter: "H",
    color: "#ff7a59",
  },
  {
    name: "Zapier",
    desc: "Connect to 6,000+ apps. Trigger Zaps on lead capture, booking, intent detection, and more.",
    tag: "Automation",
    letter: "Z",
    color: "#ff4a00",
  },
  {
    name: "Webhooks",
    desc: "Fire POST requests to any endpoint on agent-triggered events. Works with any CRM or tool.",
    tag: "Developer",
    letter: "W",
    color: "#00D9FF",
  },
  {
    name: "REST API",
    desc: "Full API access to build custom workflows, embed logic, or integrate AskYourSite into your product.",
    tag: "Developer",
    letter: "API",
    color: "#888",
  },
];

export function IntegrationsShowcase() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="integrations" className="py-24 bg-black border-b border-[#1C1C1C]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
              Integrations
            </div>
            <h2 className="text-4xl font-display font-bold text-white tracking-tight">
              Plug into your entire stack.
            </h2>
          </div>
          <p className="text-[#888] text-base max-w-sm lg:text-right">
            7 native integrations + Zapier for 6,000+ more. Data flows in. Actions fire out.
          </p>
        </div>

        {/* 3×3 grid */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1C1C1C]">
          {INTEGRATIONS.map((integration, i) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group bg-black hover:bg-[#0A0A0A] transition-colors p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <div
                    className="h-9 w-9 rounded-xl border border-[#1C1C1C] flex items-center justify-center text-[11px] font-bold"
                    style={{ backgroundColor: `${integration.color}15`, color: integration.letter === "N" ? "#888" : integration.color }}
                  >
                    {integration.letter}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{integration.name}</p>
                    <p className="text-[10px] text-[#555]">{integration.tag}</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#333] group-hover:text-[#00D9FF] transition-colors mt-0.5 shrink-0" />
              </div>
              <p className="text-[13px] text-[#888] leading-relaxed">
                {integration.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
