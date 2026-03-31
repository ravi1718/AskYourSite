export type Feature = {
  title: string;
  description: string;
};

export type Metric = {
  label: string;
  value: string;
  detail: string;
};

export type Assistant = {
  name: string;
  status: "Healthy" | "Needs review" | "Training";
  source: string;
  queries: string;
};

export const features: Feature[] = [
  {
    title: "AI sales guidance",
    description: "Turn high-intent visitors into buyers with guided recommendations and objections handled in chat.",
  },
  {
    title: "Knowledge training",
    description: "Index URLs, documents, and product details into a single assistant that answers with business context.",
  },
  {
    title: "Customer intelligence",
    description: "Surface buying signals, unanswered questions, and product interest trends from every conversation.",
  },
];

export const capabilities = [
  "Website-trained answers",
  "Product discovery flows",
  "Image-based search",
  "Self-learning review queue",
  "Embeddable chat widget",
  "Conversion analytics",
];

export const pricing = [
  { name: "Starter", price: "$29", detail: "1 assistant, 1,500 chats/month" },
  { name: "Pro", price: "$99", detail: "5 assistants, 10,000 chats/month" },
  { name: "Business", price: "Custom", detail: "Advanced workflows, team analytics" },
];

export const dashboardMetrics: Metric[] = [
  { label: "Conversations", value: "3,412", detail: "+18% this week" },
  { label: "Unanswered", value: "27", detail: "Review queue ready" },
  { label: "Conversion assist", value: "12.4%", detail: "Visitors influenced by AI" },
];

export const assistants: Assistant[] = [
  { name: "Storefront Agent", status: "Healthy", source: "shop.askyoursite.ai", queries: "1,284" },
  { name: "Support Copilot", status: "Needs review", source: "docs.askyoursite.ai", queries: "318" },
  { name: "Summer Campaign AI", status: "Training", source: "launch.askyoursite.ai", queries: "89" },
];

export const onboardingChecklist = [
  "Connect Supabase project and enable Google auth.",
  "Add your website URL and crawl the core content.",
  "Upload documents and product notes for richer answers.",
  "Review unanswered questions and publish the widget snippet.",
];
