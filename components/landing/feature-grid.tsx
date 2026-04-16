"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  MessageSquare, Zap, Users, Mail, GitBranch, Bell, Image, BarChart3,
  FileText, Sheet, Database, Globe2, Hash, CalendarDays, Webhook, Code2,
  UserPlus, Palette, Layers, Download,
} from "lucide-react";

const FEATURES = [
  { icon: MessageSquare, label: "AI Chat", desc: "Sub-second answers from your content" },
  { icon: Zap, label: "Agent Mode", desc: "Intent detection + autonomous actions" },
  { icon: Users, label: "Human Handoff", desc: "Seamless escalation to your team" },
  { icon: Mail, label: "Lead Capture", desc: "Auto-collect emails and contact info" },
  { icon: GitBranch, label: "Workflows", desc: "Multi-step automation sequences" },
  { icon: Bell, label: "Proactive Triggers", desc: "Open chat at the right moment" },
  { icon: Image, label: "Image Search", desc: "Visual context from uploaded images" },
  { icon: BarChart3, label: "Analytics", desc: "Conversation metrics and insights" },
  { icon: FileText, label: "Notion Sync", desc: "Auto-sync pages and databases" },
  { icon: Sheet, label: "Google Suite", desc: "Docs, Sheets, and Drive" },
  { icon: Database, label: "HubSpot", desc: "Knowledge base + blog sync" },
  { icon: Globe2, label: "Airtable", desc: "Sync tables as structured knowledge" },
  { icon: Hash, label: "Slack Alerts", desc: "Real-time intent notifications" },
  { icon: CalendarDays, label: "Calendly", desc: "In-chat booking and confirmation" },
  { icon: Webhook, label: "Zapier", desc: "6,000+ integrations via Zaps" },
  { icon: Code2, label: "REST API", desc: "Build on top of AskYourSite" },
  { icon: UserPlus, label: "Team Workspace", desc: "Invite team members and set roles" },
  { icon: Palette, label: "Custom Branding", desc: "Colors, logo, fonts, and tone" },
  { icon: Layers, label: "White Label", desc: "Remove all AskYourSite branding" },
  { icon: Download, label: "CSV Export", desc: "Export leads and conversation data" },
];

export function FeatureGrid() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="features" className="py-24 bg-black border-b border-[#1C1C1C]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
            Everything Included
          </div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight mb-3">
            The complete support stack.
          </h2>
          <p className="text-[#888] text-lg">
            No add-ons. No hidden gating. Every feature ships with every plan.
          </p>
        </div>

        {/* Grid */}
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-[#1C1C1C]">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className="bg-black p-5 hover:bg-[#0A0A0A] transition-colors group"
              >
                <Icon className="h-5 w-5 text-[#333] group-hover:text-[#00D9FF] mb-3 transition-colors" />
                <p className="text-[13px] font-semibold text-white mb-1">{feature.label}</p>
                <p className="text-[11px] text-[#555] leading-snug">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
