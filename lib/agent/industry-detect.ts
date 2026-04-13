export type Industry = 'ecommerce' | 'saas' | 'edtech' | 'services' | 'general';

const INDUSTRY_KEYWORDS: Record<Industry, string[]> = {
  ecommerce: ['shop', 'store', 'buy', 'cart', 'product', 'price', 'order', 'shipping', 'checkout', 'inventory', 'catalog', 'retail', 'purchase', 'discount', 'coupon'],
  saas:      ['software', 'platform', 'dashboard', 'api', 'subscription', 'trial', 'features', 'integration', 'automation', 'workflow', 'analytics', 'enterprise', 'saas', 'app'],
  edtech:    ['course', 'learn', 'lesson', 'student', 'tutorial', 'certificate', 'quiz', 'instructor', 'curriculum', 'training', 'education', 'class', 'module', 'assessment'],
  services:  ['appointment', 'consult', 'book', 'quote', 'schedule', 'service', 'expert', 'agency', 'freelance', 'contractor', 'professional', 'advisor', 'coach', 'therapist'],
  general:   [],
};

export function detectIndustry(businessSummary = '', websiteUrl = ''): Industry {
  const text = (businessSummary + ' ' + websiteUrl).toLowerCase();
  const scores = (Object.entries(INDUSTRY_KEYWORDS) as [Industry, string[]][])
    .filter(([industry]) => industry !== 'general')
    .map(([industry, keywords]) => ({
      industry,
      score: keywords.filter(k => text.includes(k)).length,
    }));

  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best && best.score >= 2 ? best.industry : 'general';
}

export const INDUSTRY_GOALS: Record<Industry, string> = {
  ecommerce: `INDUSTRY GOALS (E-commerce):
- Primary: Drive conversions and increase average order value
- Secondary: Reduce cart abandonment, handle objections, upsell/cross-sell
- High-intent signals: price questions, "does it ship to", "how long does delivery", "do you have X in stock"
- Default actions: recommend_product → capture_lead → trigger_discount (if hesitating on price)`,

  saas: `INDUSTRY GOALS (SaaS):
- Primary: Activate trials, improve onboarding, reduce churn
- Secondary: Qualify leads, guide to right plan, explain features
- High-intent signals: "can I try", "how much does it cost", "does it integrate with", "how do I get started"
- Default actions: book_demo → capture_lead → track_event (feature interest)`,

  edtech: `INDUSTRY GOALS (EdTech):
- Primary: Improve learning outcomes and student engagement
- Secondary: Reduce dropout, suggest next steps, connect stuck students to help
- High-intent signals: repeated confusion, "I don't understand", "can you explain", course/enrollment questions
- Default actions: assign_human_agent (if stuck after 2 attempts) → track_event → send_notification`,

  services: `INDUSTRY GOALS (Services):
- Primary: Capture and qualify leads, book appointments
- Secondary: Understand project scope, set expectations, push toward consultation
- High-intent signals: "how much does it cost", "how long does it take", "I need X done by Y", "are you available"
- Default actions: capture_lead → book_demo → update_crm`,

  general: `INDUSTRY GOALS (General):
- Primary: Answer questions helpfully and guide users to their goal
- Secondary: Capture high-intent leads, connect users to the right resource
- High-intent signals: pricing questions, "how do I get started", direct requests
- Default actions: capture_lead → send_notification`,
};
