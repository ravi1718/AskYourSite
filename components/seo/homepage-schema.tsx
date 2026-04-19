export function HomepageSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "AskYourSite",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "url": "https://askyoursite.in/",
        "description":
          "AI-powered chatbot that installs on any website, handles customer support automatically, captures leads, and books sales calls. Sub-second response, human handoff when needed.",
        "featureList": [
          "Intent detection with 5 behavioral signals",
          "Human handoff routing to Slack or email",
          "Lead capture with custom fields",
          "Calendly & HubSpot integrations",
          "Website crawler — train on your own content",
          "Multi-language support",
          "Embeddable widget, no coding required",
        ],
        "offers": [
          {
            "@type": "Offer",
            "name": "Starter",
            "price": "20.00",
            "priceCurrency": "USD",
            "priceValidUntil": "2027-01-01",
            "description": "1 AI agent, 200 conversations/month, ~50 pages training",
          },
          {
            "@type": "Offer",
            "name": "Pro",
            "price": "69.00",
            "priceCurrency": "USD",
            "priceValidUntil": "2027-01-01",
            "description":
              "3 AI agents, 1,000 conversations/month, ~200 pages training, image search, full integrations",
          },
          {
            "@type": "Offer",
            "name": "Business",
            "price": "149.00",
            "priceCurrency": "USD",
            "priceValidUntil": "2027-01-01",
            "description":
              "10 AI agents, 5,000 conversations/month, ~500 pages training, team workspace, human handoff inbox",
          },
        ],
        "provider": { "@id": "https://askyoursite.in/#organization" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is AskYourSite?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AskYourSite is an AI chat widget that installs on any website and automatically handles customer support questions, qualifies leads, and books sales calls. It trains on your website content and responds in under one second, escalating to a human agent when needed.",
            },
          },
          {
            "@type": "Question",
            "name": "How does AskYourSite train on my website?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AskYourSite crawls your website URLs and uses that content to train your AI agent. Simply enter your website URL, wait for the crawler to index your pages, and your AI is ready to answer questions based on your actual content — no manual data entry required.",
            },
          },
          {
            "@type": "Question",
            "name": "How much does AskYourSite cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Plans start at $20/month (Starter: 1 agent, 200 conversations), $69/month (Pro: 3 agents, 1,000 conversations, full integrations), and $149/month (Business: 10 agents, 5,000 conversations, team workspace). All plans include a 7-day free trial with no credit card required.",
            },
          },
          {
            "@type": "Question",
            "name": "Does AskYourSite integrate with HubSpot, Slack, or Calendly?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. AskYourSite integrates with Slack (for human handoff alerts), Calendly (for booking demos or calls inside the chat), HubSpot (for CRM lead sync), Notion, Airtable, Google Sheets, and Zapier for custom workflows.",
            },
          },
          {
            "@type": "Question",
            "name": "What makes AskYourSite different from Intercom or Drift?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AskYourSite is purpose-built for websites that want AI-first support with minimal setup. Unlike Intercom or Drift, it auto-trains on your website content (no manual knowledge base), deploys in under 60 seconds, and costs a fraction of enterprise tools. It also detects 5 types of visitor intent — buying intent, frustration, urgency, unanswered questions, and repeat visit patterns — to know exactly when to escalate or trigger a proactive message.",
            },
          },
          {
            "@type": "Question",
            "name": "How do I embed AskYourSite on my website?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "After creating your AI agent and training it, you get a one-line JavaScript embed code. Paste it before the closing </body> tag of your website. The chat widget appears instantly — no framework or coding knowledge needed.",
            },
          },
          {
            "@type": "Question",
            "name": "Can AskYourSite capture leads?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. AskYourSite can collect visitor name, email, phone number, and custom fields before or during a conversation. Captured leads are visible in your dashboard and can be synced to HubSpot, Airtable, or exported as CSV.",
            },
          },
          {
            "@type": "Question",
            "name": "What happens when the AI cannot answer a question?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "When the AI detects it cannot confidently answer, it automatically routes the conversation to a human agent via your Slack channel or email inbox. All unanswered questions are logged in your dashboard so you can train the AI on gaps.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
