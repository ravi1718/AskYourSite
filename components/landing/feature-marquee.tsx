const FEATURES = [
  "AI Chat",
  "Agent Mode",
  "Human Handoff",
  "Lead Capture",
  "Workflows",
  "Image Search",
  "Notion Sync",
  "Google Docs",
  "Airtable",
  "HubSpot",
  "Slack Alerts",
  "Calendly",
  "Zapier",
  "Analytics",
  "Proactive Triggers",
  "Team Workspace",
  "API Access",
  "Custom Branding",
  "CSV Export",
  "White Label",
];

export function FeatureMarquee() {
  const items = [...FEATURES, ...FEATURES]; // duplicate for seamless loop

  return (
    <div className="border-b border-[#1C1C1C] bg-black overflow-hidden py-4">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-4 mx-6">
            <span className="text-xs uppercase tracking-widest text-[#333] font-medium">{f}</span>
            <span className="h-1 w-1 rounded-full bg-[#333]" />
          </span>
        ))}
      </div>
    </div>
  );
}
