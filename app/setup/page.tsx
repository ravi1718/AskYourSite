import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock } from "lucide-react";

interface Step {
  heading: string;
  items: string[];
}

interface Industry {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  time: string;
  steps: Step[];
  integrations: string[];
  triggers: string[];
}

const industries: Industry[] = [
  {
    id: "ecommerce",
    emoji: "🛒",
    name: "E-Commerce & Retail",
    tagline: "Answer product questions, handle returns, and capture purchase intent — automatically.",
    time: "≈ 20 min",
    steps: [
      {
        heading: "Train your AI",
        items: [
          "Crawl your product catalog and category pages",
          "Upload your return, shipping, and refund policy PDF",
          "Connect Airtable with your live product inventory",
        ],
      },
      {
        heading: "Configure agent mode",
        items: [
          "Enable buying intent detection",
          "Set webhook → your CRM when intent score > 0.8",
          "Enable lead capture to collect email before chat starts",
        ],
      },
      {
        heading: "Connect integrations",
        items: ["Slack", "Calendly", "Airtable", "Zapier → Klaviyo"],
      },
      {
        heading: "Add proactive triggers",
        items: [
          'Cart page, 30s: "Need help choosing the right size?"',
          'Checkout page, exit intent: "Can I answer anything before you go?"',
        ],
      },
    ],
    integrations: ["Slack", "Calendly", "Airtable", "Zapier"],
    triggers: ["Cart page — 30 s idle", "Checkout — exit intent", "Product page — 45 s scroll"],
  },
  {
    id: "saas",
    emoji: "🖥️",
    name: "SaaS & Tech",
    tagline: "Turn your docs into an always-on support agent that escalates demo intent to your team.",
    time: "≈ 15 min",
    steps: [
      {
        heading: "Train your AI",
        items: [
          "Crawl your documentation site and changelog",
          "Upload onboarding guides and FAQ PDFs",
          "Sync Notion knowledge base via integration",
        ],
      },
      {
        heading: "Configure agent mode",
        items: [
          "Enable unanswered question queue for gap detection",
          'Set Slack alert when a visitor mentions "pricing" or "demo"',
          "Connect webhook → HubSpot / Salesforce for demo-intent leads",
        ],
      },
      {
        heading: "Connect integrations",
        items: ["Slack", "Notion", "Calendly", "Webhooks → CRM"],
      },
      {
        heading: "Add proactive triggers",
        items: [
          'Pricing page, 20 s: "Want me to walk you through our plans?"',
          'Signup page, 60 s: "Any questions before you create your account?"',
        ],
      },
    ],
    integrations: ["Slack", "Notion", "Calendly", "Webhooks"],
    triggers: ["Pricing page — 20 s", "Docs page — 90 s idle", "Signup page — 60 s"],
  },
  {
    id: "education",
    emoji: "🎓",
    name: "Education & Training",
    tagline: "Answer enrollment questions 24/7 and let your team focus on high-value counseling sessions.",
    time: "≈ 20 min",
    steps: [
      {
        heading: "Train your AI",
        items: [
          "Crawl your course catalog and program pages",
          "Upload enrollment FAQs, brochures, and fee structures",
          "Add curriculum PDFs for each program",
        ],
      },
      {
        heading: "Configure agent mode",
        items: [
          "Enable human handoff for admissions queries",
          "Configure Calendly integration for counselor booking",
          "Enable lead capture to collect name, email, and program interest",
        ],
      },
      {
        heading: "Connect integrations",
        items: ["Calendly", "Slack", "Webhooks → CRM"],
      },
      {
        heading: "Add proactive triggers",
        items: [
          'Course detail page, 30 s: "Have questions about this program?"',
          'Application page, exit intent: "Would you like to speak with an advisor?"',
        ],
      },
    ],
    integrations: ["Calendly", "Slack", "Webhooks"],
    triggers: ["Course page — 30 s", "Application page — exit intent", "Programs listing — 60 s"],
  },
  {
    id: "professional",
    emoji: "💼",
    name: "Professional Services",
    tagline: "Qualify leads, book discovery calls, and hand off high-value prospects to your team instantly.",
    time: "≈ 15 min",
    steps: [
      {
        heading: "Train your AI",
        items: [
          "Crawl your services, case studies, and team pages",
          "Upload service scope documents and pricing guides",
          "Add client testimonials and process FAQs",
        ],
      },
      {
        heading: "Configure agent mode",
        items: [
          "Enable lead capture form before conversation starts",
          "Set Calendly link for discovery call booking",
          "Configure urgent human handoff for high-budget prospects",
        ],
      },
      {
        heading: "Connect integrations",
        items: ["Calendly", "Slack", "Webhooks → CRM"],
      },
      {
        heading: "Add proactive triggers",
        items: [
          'Services page, 40 s: "Can I help you find the right service?"',
          'Contact page: "Book a free 15-minute discovery call →"',
        ],
      },
    ],
    integrations: ["Calendly", "Slack", "Webhooks"],
    triggers: ["Services page — 40 s", "Contact page — immediate", "Case studies — 60 s"],
  },
  {
    id: "healthcare",
    emoji: "🏥",
    name: "Healthcare & Wellness",
    tagline: "Answer common health questions, book appointments, and escalate urgent cases to your staff.",
    time: "≈ 20 min",
    steps: [
      {
        heading: "Train your AI",
        items: [
          "Crawl your services, conditions treated, and team pages",
          "Upload patient FAQs, insurance accepted, and hours",
          "Add procedure guides and aftercare documents",
        ],
      },
      {
        heading: "Configure agent mode",
        items: [
          "Configure Calendly for appointment booking",
          "Enable urgency detection → instant human handoff",
          "Scope agent to never give clinical diagnoses",
        ],
      },
      {
        heading: "Connect integrations",
        items: ["Calendly", "Slack", "Webhooks → EHR"],
      },
      {
        heading: "Add proactive triggers",
        items: [
          'Services page, 30 s: "Would you like to schedule a consultation?"',
          'Homepage, 60 s: "Any questions about our services or availability?"',
        ],
      },
    ],
    integrations: ["Calendly", "Slack", "Webhooks"],
    triggers: ["Services page — 30 s", "Homepage — 60 s", "Booking page — immediate"],
  },
  {
    id: "realestate",
    emoji: "🏠",
    name: "Real Estate",
    tagline: "Answer property questions, schedule viewings, and capture buyer and renter leads around the clock.",
    time: "≈ 20 min",
    steps: [
      {
        heading: "Train your AI",
        items: [
          "Crawl your property listing and neighborhood pages",
          "Upload neighborhood guides, floor plans, and amenity docs",
          "Add buyer and renter FAQs",
        ],
      },
      {
        heading: "Configure agent mode",
        items: [
          "Enable lead capture with budget and timeline fields",
          "Set Calendly for viewing appointments",
          "Connect webhook → your CRM when a lead is captured",
        ],
      },
      {
        heading: "Connect integrations",
        items: ["Calendly", "Airtable", "Slack", "Webhooks → CRM"],
      },
      {
        heading: "Add proactive triggers",
        items: [
          'Listing page, 30 s: "Interested in this property? Book a viewing →"',
          'Search results, 45 s: "Want help narrowing down these listings?"',
        ],
      },
    ],
    integrations: ["Calendly", "Airtable", "Slack", "Webhooks"],
    triggers: ["Listing page — 30 s", "Search results — 45 s", "Contact page — immediate"],
  },
  {
    id: "travel",
    emoji: "✈️",
    name: "Travel & Hospitality",
    tagline: "Handle booking questions, surface the right packages, and convert browsers into confirmed guests.",
    time: "≈ 15 min",
    steps: [
      {
        heading: "Train your AI",
        items: [
          "Crawl your destination, package, and itinerary pages",
          "Upload cancellation policies and travel FAQs",
          "Add accommodation and transport guides",
        ],
      },
      {
        heading: "Configure agent mode",
        items: [
          "Set booking links via Calendly or direct URL",
          "Enable urgency detection for last-minute travellers",
          "Configure lead capture for quote requests",
        ],
      },
      {
        heading: "Connect integrations",
        items: ["Calendly", "Slack", "Webhooks → booking system"],
      },
      {
        heading: "Add proactive triggers",
        items: [
          'Pricing/packages page, 20 s: "Need help choosing the right package?"',
          'Checkout, exit intent: "Still deciding? I can answer any questions."',
        ],
      },
    ],
    integrations: ["Calendly", "Slack", "Webhooks"],
    triggers: ["Packages page — 20 s", "Checkout — exit intent", "Destinations page — 50 s"],
  },
  {
    id: "agency",
    emoji: "🎨",
    name: "Agency & Marketing",
    tagline: "Showcase your work, qualify inbound leads, and alert your team the moment a hot prospect arrives.",
    time: "≈ 15 min",
    steps: [
      {
        heading: "Train your AI",
        items: [
          "Crawl your portfolio, case studies, and services pages",
          "Upload client decks, process docs, and service briefs",
          "Add testimonials and results summaries",
        ],
      },
      {
        heading: "Configure agent mode",
        items: [
          "Enable lead capture with project type and budget fields",
          "Set Slack alert when a visitor mentions a budget range",
          "Connect webhook → your CRM or Notion project tracker",
        ],
      },
      {
        heading: "Connect integrations",
        items: ["Slack", "Notion", "Calendly", "Webhooks → CRM"],
      },
      {
        heading: "Add proactive triggers",
        items: [
          'Services page, 30 s: "Tell me about your project and I\'ll match you to the right service."',
          'Case studies, 60 s: "Want to see results like this for your brand?"',
        ],
      },
    ],
    integrations: ["Slack", "Notion", "Calendly", "Webhooks"],
    triggers: ["Services page — 30 s", "Case studies — 60 s", "Contact page — immediate"],
  },
];

const industryAnchors = industries.map((i) => ({ id: i.id, emoji: i.emoji, name: i.name }));

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#1C1C1C] bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="AskYourSite" width={30} height={30} className="rounded-lg" />
            <span className="font-display text-base font-bold text-white tracking-tight">AskYourSite</span>
          </Link>
          <Link href="/"
            className="flex items-center gap-1.5 text-sm text-[#888] hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="pt-24 pb-32">
        {/* Hero */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
            Setup Guide
          </div>
          <h1 className="text-5xl lg:text-6xl font-display font-bold text-white tracking-tight leading-[1.05] mb-5 max-w-3xl">
            Set up AskYourSite for your industry.
          </h1>
          <p className="text-[#888] text-lg leading-relaxed max-w-xl">
            Step-by-step guides for every use case. Pick your industry below and follow the four steps to go live.
          </p>
        </div>

        {/* Quick-nav pills */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-20">
          <div className="flex flex-wrap gap-2">
            {industryAnchors.map((i) => (
              <a
                key={i.id}
                href={`#${i.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-sm text-[#888] hover:border-[#333] hover:text-white transition-all"
              >
                <span>{i.emoji}</span>
                {i.name}
              </a>
            ))}
          </div>
        </div>

        {/* Industry sections */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-px">
          {industries.map((industry) => (
            <section
              key={industry.id}
              id={industry.id}
              className="border border-[#1C1C1C] bg-[#0A0A0A] scroll-mt-24"
            >
              {/* Industry header */}
              <div className="flex items-start justify-between gap-6 px-8 py-7 border-b border-[#1C1C1C]">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{industry.emoji}</span>
                  <div>
                    <h2 className="text-xl font-display font-bold text-white mb-1">{industry.name}</h2>
                    <p className="text-sm text-[#888] max-w-xl">{industry.tagline}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-[#1C1C1C] bg-black px-3 py-1 text-xs font-medium text-[#555]">
                  <Clock className="h-3 w-3" />
                  {industry.time}
                </div>
              </div>

              {/* Steps grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1C1C1C]">
                {industry.steps.map((step, idx) => (
                  <div key={idx} className="bg-[#0A0A0A] px-8 py-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-5 w-5 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center text-[10px] font-bold text-[#00D9FF]">
                        {idx + 1}
                      </span>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#555]">
                        Step {idx + 1} — {step.heading}
                      </p>
                    </div>
                    <ul className="space-y-2.5">
                      {step.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-[#888]">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#00D9FF]/50 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Footer bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-8 py-5 border-t border-[#1C1C1C]">
                <div className="flex flex-wrap gap-2">
                  {industry.integrations.map((name) => (
                    <span key={name} className="rounded-full border border-[#1C1C1C] bg-black px-3 py-1 text-xs text-[#555]">
                      {name}
                    </span>
                  ))}
                </div>
                <Link
                  href="/login"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-all"
                >
                  Get Started Free →
                </Link>
              </div>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-20 text-center">
          <p className="text-[#555] text-sm mb-6">
            Don&apos;t see your industry? Every feature works for any business — just start with a URL crawl.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-all"
          >
            Start your free trial →
          </Link>
        </div>
      </div>
    </div>
  );
}
