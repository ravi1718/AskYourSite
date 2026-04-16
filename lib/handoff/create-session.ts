import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoogleGenAI } from "@google/genai";
import { generateHandoffSummary } from "./generate-summary";
import { sendHandoffNotificationEmail } from "./send-email";
import { dispatchEvent } from "@/lib/events/dispatch";
import type { HandoffTriggerReason } from "./detect-triggers";

interface CreateHandoffParams {
  adminDb: SupabaseClient;
  ai: GoogleGenAI;
  assistantId: string;
  sessionId: string;
  visitorId?: string | null;
  triggerReason: HandoffTriggerReason;
  triggerMessage: string;
  // Denormalized owner context
  ownerId: string;
  ownerEmail: string;
  assistantName: string;
  // Feature flag already checked by caller
}

export interface HandoffSession {
  id: string;
  join_token: string;
  status: string;
}

/**
 * Creates a handoff session:
 * 1. Idempotency check (bail if already active)
 * 2. Denormalize visitor info
 * 3. INSERT handoff_sessions row
 * 4. Non-blocking: generate AI summary + update row
 * 5. Non-blocking: send email notification to owner
 * 6. Non-blocking: dispatch 'handoff.created' event
 *
 * Call this from the `finally` block of /api/chat — it never delays the response.
 */
export async function createHandoffSession(
  params: CreateHandoffParams
): Promise<HandoffSession | null> {
  const {
    adminDb,
    ai,
    assistantId,
    sessionId,
    visitorId,
    triggerReason,
    triggerMessage,
    ownerId,
    ownerEmail,
    assistantName,
  } = params;

  // 1. Idempotency — bail if a waiting or active handoff already exists for this session
  const { data: existing } = await adminDb
    .from("handoff_sessions")
    .select("id, join_token, status")
    .eq("session_id", sessionId)
    .in("status", ["waiting", "active"])
    .maybeSingle();

  if (existing) return existing as HandoffSession;

  // 2. Fetch visitor profile for denormalized fields
  let visitorName: string | null = null;
  let visitorEmail: string | null = null;
  let visitorSentiment: number | null = null;

  if (visitorId) {
    const { data: vp } = await adminDb
      .from("visitor_profiles")
      .select("name, email, sentiment_avg")
      .eq("visitor_id", visitorId)
      .eq("assistant_id", assistantId)
      .maybeSingle();

    if (vp) {
      visitorName = vp.name || null;
      visitorEmail = vp.email || null;
      visitorSentiment = vp.sentiment_avg || null;
    }
  }

  // 3. INSERT handoff_sessions (ai_summary = null initially; filled in non-blocking step)
  const { data: newHandoff, error: insertError } = await adminDb
    .from("handoff_sessions")
    .insert({
      assistant_id: assistantId,
      session_id: sessionId,
      visitor_id: visitorId || null,
      trigger_reason: triggerReason,
      trigger_message: triggerMessage,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      visitor_sentiment: visitorSentiment,
      status: "waiting",
    })
    .select("id, join_token, status")
    .single();

  if (insertError || !newHandoff) {
    console.error("[Handoff] Failed to create handoff session:", insertError?.message);
    return null;
  }

  const handoff = newHandoff as HandoffSession;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.askyoursite.in";

  // 4. Non-blocking: fetch recent messages, generate AI summary, update the row
  void (async () => {
    try {
      const { data: recentMessages } = await adminDb
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!recentMessages || recentMessages.length === 0) return;

      const messages = [...recentMessages].reverse(); // chronological order
      const summary = await generateHandoffSummary(ai, messages);

      await adminDb
        .from("handoff_sessions")
        .update({ ai_summary: summary, updated_at: new Date().toISOString() })
        .eq("id", handoff.id);
    } catch (err) {
      console.error("[Handoff] Summary generation failed:", err);
    }
  })();

  // 5. Non-blocking: send email notification to workspace owner
  void sendHandoffNotificationEmail({
    ownerEmail,
    assistantName,
    visitorName,
    visitorEmail,
    triggerReason,
    aiSummary: null, // email sends immediately; summary arrives async
    joinToken: handoff.join_token,
    appBaseUrl,
  }).catch((err) => console.error("[Handoff] Email failed:", err));

  // 6. Non-blocking: fire event to Slack/Zapier
  const joinUrl = `${appBaseUrl}/live-chat/${handoff.join_token}`;
  dispatchEvent("handoff.created", {
    userId: ownerId,
    botId: assistantId,
    botName: assistantName,
    sessionId,
    triggerReason,
    visitorName,
    visitorEmail,
    aiSummary: null,
    joinUrl,
    timestamp: new Date().toISOString(),
  });

  console.log(`[Handoff] Created: ${handoff.id} | reason: ${triggerReason} | session: ${sessionId}`);
  return handoff;
}
