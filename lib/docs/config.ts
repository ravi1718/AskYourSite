import { NavSection, NavItem } from "./types";

export const DOC_SECTIONS: NavSection[] = [
  {
    title: "Getting Started",
    icon: "Rocket",
    defaultOpen: true,
    items: [
      { label: "Quick Start",      slug: "quickstart",       section: "getting-started" },
      { label: "Widget Embedding", slug: "widget-embedding", section: "getting-started" },
      { label: "AI Assistants",    slug: "ai-assistants",    section: "getting-started" },
    ],
  },
  {
    title: "Integrations",
    icon: "Puzzle",
    defaultOpen: false,
    items: [
      { label: "Zapier",        slug: "zapier",        section: "integrations" },
      { label: "Slack",         slug: "slack",         section: "integrations" },
      { label: "Notion",        slug: "notion",        section: "integrations" },
      { label: "Calendly",      slug: "calendly",      section: "integrations" },
      { label: "Google Docs",   slug: "google-docs",   section: "integrations" },
      { label: "Google Sheets", slug: "google-sheets", section: "integrations" },
      { label: "Google Drive",  slug: "google-drive",  section: "integrations" },
      { label: "HubSpot",       slug: "hubspot",       section: "integrations" },
      { label: "Airtable",      slug: "airtable",      section: "integrations" },
      { label: "Cal.com",       slug: "cal-com",       section: "integrations", badge: "coming-soon" },
    ],
  },
  {
    title: "Features",
    icon: "Layers",
    defaultOpen: false,
    items: [
      { label: "Knowledge Base", slug: "knowledge-base", section: "features" },
      { label: "Analytics",      slug: "analytics",      section: "features" },
    ],
  },
  {
    title: "Billing & Plans",
    icon: "CreditCard",
    defaultOpen: false,
    items: [
      { label: "Plans Overview", slug: "plans", section: "billing" },
    ],
  },
  {
    title: "API Reference",
    icon: "Code2",
    defaultOpen: false,
    items: [
      { label: "Overview",       slug: "overview",       section: "api" },
      { label: "Authentication", slug: "authentication", section: "api" },
      { label: "Endpoints",      slug: "endpoints",      section: "api" },
    ],
  },
];

export const ALL_DOC_ITEMS: NavItem[] = DOC_SECTIONS.flatMap((s) => s.items);
