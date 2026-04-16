import type { SupabaseClient } from "@supabase/supabase-js";
import {
  detectUrgency,
  detectUnanswered,
  normalizeQuestion,
  hashQuestion,
} from "@/lib/slack/detect";

// ── Explicit human-request phrases ──────────────────────────────────────────
const EXPLICIT_HUMAN_PATTERNS = [
  // talk to …
  "talk to a human",
  "talk to human",
  "talk to someone",
  "talk to a person",
  "talk to a real person",
  "talk with a human",
  "talk with someone",
  "talk with a person",
  // speak to …
  "speak to a human",
  "speak to human",
  "speak to someone",
  "speak to an agent",
  "speak to a person",
  "speak to a real person",
  "speak with a human",
  "speak with someone",
  "speak with an agent",
  "speak with a person",
  // connect / transfer
  "connect me to a human",
  "connect me to an agent",
  "connect me with",
  "connect to a human",
  "transfer me",
  "hand me off",
  "hand off to",
  // want / need human
  "want human",
  "want a human",
  "want a person",
  "i want a person",
  "i want to speak",
  "i want to talk",
  "i need a human",
  "need a human",
  "need a person",
  "get me a human",
  "get human",
  "get a person",
  // agent / support labels
  "human agent",
  "human support",
  "human help",
  "human please",
  "live agent",
  "live support",
  "live chat",
  "real person",
  "actual person",
  "real agent",
  "real human",
  "someone real",
  // join / help phrases
  "join this chat",
  "join the chat",
  "human to join",
  "person to join",
  // generic escalation
  "get support",
  "need support",
  "customer service",
  "customer support",
  "agent please",
  "escalate",
  "supervisor",
];

export function detectHumanRequest(msg: string): boolean {
  const lower = msg.toLowerCase();
  return EXPLICIT_HUMAN_PATTERNS.some((p) => lower.includes(p));
}

// ── Trigger reasons ──────────────────────────────────────────────────────────
export type HandoffTriggerReason =
  | "explicit_request"
  | "urgency"
  | "frustration"
  | "unanswered_streak"
  | "repeated_question";

export type HandoffTriggerResult =
  | { triggered: true; reason: HandoffTriggerReason }
  | { triggered: false };

// ── Full evaluation (triggers 1-2 are synchronous; 3-5 need DB) ─────────────
export async function evaluateHandoffTriggers(
  adminDb: SupabaseClient,
  params: {
    sessionId: string;
    userMessage: string;
    botResponse: string;
    // In existing app: 1=calm, 5=very frustrated
    sentimentScore: number | null;
    sentimentAvg: number | null;
  }
): Promise<HandoffTriggerResult> {
  const { sessionId, userMessage, botResponse, sentimentScore, sentimentAvg } = params;

  // 1. Explicit human request (synchronous, no DB)
  if (detectHumanRequest(userMessage)) {
    return { triggered: true, reason: "explicit_request" };
  }

  // 2. Urgency keyword (synchronous, no DB)
  if (detectUrgency(userMessage)) {
    return { triggered: true, reason: "urgency" };
  }

  // 3. Frustration via sentiment score
  //    Convention in this app: 1=calm, 5=very frustrated
  if (sentimentScore !== null && sentimentScore >= 4) {
    return { triggered: true, reason: "frustration" };
  }
  if (sentimentAvg !== null && sentimentAvg >= 4.0) {
    return { triggered: true, reason: "frustration" };
  }

  // 4. Unanswered streak: 2+ consecutive AI messages that couldn't answer
  {
    const { data: recentAssistant } = await adminDb
      .from("chat_messages")
      .select("content")
      .eq("session_id", sessionId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentAssistant) {
      // Count streak starting from the most-recent (which is botResponse itself)
      let streak = detectUnanswered(botResponse) ? 1 : 0;
      for (const msg of recentAssistant) {
        if (detectUnanswered(msg.content)) streak++;
        else break;
      }
      if (streak >= 2) return { triggered: true, reason: "unanswered_streak" };
    }
  }

  // 5. Repeated question: same question asked 3+ times in this session
  {
    const normalized = normalizeQuestion(userMessage);
    const hash = hashQuestion(normalized);

    const { data: userMessages } = await adminDb
      .from("chat_messages")
      .select("content")
      .eq("session_id", sessionId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(20);

    if (userMessages) {
      const matchCount = userMessages.filter(
        (m) => hashQuestion(normalizeQuestion(m.content)) === hash
      ).length;
      if (matchCount >= 3) return { triggered: true, reason: "repeated_question" };
    }
  }

  return { triggered: false };
}
