import crypto from "crypto";

// ── Frustration detection ────────────────────────────────────────────────────
export const FRUSTRATION_PATTERNS = [
  "not working", "doesn't work", "does not work", "broken", "terrible",
  "useless", "frustrated", "frustrating", "annoying", "waste of time",
  "still not", "tried multiple", "keeps failing", "same issue", "same problem",
  "this is wrong", "makes no sense", "awful", "horrible", "worst",
  "completely wrong", "stop working", "never works",
];

export function detectFrustration(msg: string): boolean {
  const lower = msg.toLowerCase();
  return FRUSTRATION_PATTERNS.some((p) => lower.includes(p));
}

// ── Urgency detection ────────────────────────────────────────────────────────
export const URGENCY_PATTERNS = [
  "asap", "urgent", "urgently", "immediately", "right now", "right away",
  "critical", "emergency", "need this now", "time sensitive", "time-sensitive",
  "deadline", "launch tomorrow", "launching today", "going live", "must fix",
  "need help now", "very important",
];

export function detectUrgency(msg: string): boolean {
  const lower = msg.toLowerCase();
  return URGENCY_PATTERNS.some((p) => lower.includes(p));
}

// Unanswered detection patterns — kept in sync with app/api/analytics/route.ts
export const UNANSWERED_PATTERNS = [
  "i don't have information about",
  "i don't know",
  "i'm not sure about",
  "i couldn't find",
  "i don't have details on",
  "not in my knowledge",
  "i'm unable to find",
  "i cannot find",
  "no information available",
  "outside my knowledge",
  "i don't have enough information",
  "no specific context",
];

// Buying intent keywords — any substring match triggers an alert
export const BUYING_INTENT_KEYWORDS = [
  "pricing", "price", "how much", "cost", "costs",
  "buy", "purchase", "subscribe", "subscription", "sign up",
  "upgrade", "enterprise", "team plan", "get started",
  "invoice", "billing", "payment", "pay", "credit card",
  "what plan", "which plan", "plans", "tiers",
  "free trial", "trial", "demo", "book a demo", "schedule a demo",
  "talk to sales", "speak with someone", "contact sales",
];

/** Returns true if the bot response indicates it couldn't answer the question. */
export function detectUnanswered(botResponse: string): boolean {
  const lower = botResponse.toLowerCase();
  return UNANSWERED_PATTERNS.some((p) => lower.includes(p));
}

/** Returns true if the user's message contains buying intent signals. */
export function detectBuyingIntent(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();
  return BUYING_INTENT_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Normalize a question for deduplication: lowercase, strip punctuation, trim. */
export function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

/** SHA-256 hex hash of a normalized question string for dedup lookup. */
export function hashQuestion(normalized: string): string {
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
