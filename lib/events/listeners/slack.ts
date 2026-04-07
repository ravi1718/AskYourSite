import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSlackAlert } from "@/lib/slack/send-alert";
import { leadBlock, buyingIntentBlock, unansweredBlock, bookingBlock, sentimentBlock } from "@/lib/slack/blocks";
import type { AysEvent, EventName } from "../types";

/**
 * Slack event listener — maps typed AysEvent payloads to existing sendSlackAlert calls.
 * All dedup, rate limiting, per-assistant opt-in, and webhook posting logic
 * lives in lib/slack/send-alert.ts and is unchanged.
 */
export async function handleSlackEvent<T extends EventName>(
  event: T,
  payload: AysEvent[T]
): Promise<void> {
  const p = payload as any;

  switch (event) {
    case "lead.captured": {
      const blocks = leadBlock({
        botName: p.botName,
        leadName: p.lead.name,
        leadEmail: p.lead.email,
        firstMessage: p.firstMessage ?? "",
        pageUrl: p.pageUrl ?? "",
        conversationId: p.sessionId,
      });
      await sendSlackAlert(p.userId, p.botId, p.sessionId, "lead_captured", blocks);
      break;
    }

    case "intent.detected": {
      if (p.intentType !== "buying") break;
      const blocks = buyingIntentBlock({
        botName: p.botName,
        visitorMessage: p.visitorMessage,
        botResponse: p.botResponse ?? "",
        pageUrl: p.pageUrl ?? "",
        conversationId: p.sessionId,
      });
      await sendSlackAlert(p.userId, p.botId, p.sessionId, "buying_intent", blocks);
      break;
    }

    case "question.unanswered": {
      const admin = getSupabaseAdminClient();
      let count = 1;
      if (admin) {
        const { count: todayCount } = await admin
          .from("slack_alert_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", p.userId)
          .eq("alert_type", "unanswered")
          .eq("question_hash", p.questionHash)
          .gte("sent_at", new Date(Date.now() - 86400000).toISOString());
        count = (todayCount ?? 0) + 1;
      }
      const blocks = unansweredBlock({
        botName: p.botName,
        botId: p.botId,
        question: p.question,
        count,
        conversationId: p.sessionId,
      });
      await sendSlackAlert(p.userId, p.botId, p.sessionId, "unanswered", blocks, p.questionHash);
      break;
    }

    case "booking.confirmed": {
      const blocks = bookingBlock({
        botName: p.botName,
        inviteeName: p.inviteeName,
        inviteeEmail: p.inviteeEmail,
        meetingTitle: p.meetingTitle,
        meetingTime: p.meetingTime,
        calendlyEventUrl: p.calendlyEventUrl,
        conversationId: p.sessionId,
      });
      await sendSlackAlert(p.userId, p.botId, p.sessionId, "booking_confirmed", blocks);
      break;
    }

    case "sentiment.detected": {
      const blocks = sentimentBlock({
        botName: p.botName,
        sentimentType: p.sentimentType,
        visitorMessage: p.visitorMessage,
        conversationId: p.sessionId,
      });
      const alertType = p.sentimentType === "frustration" ? "frustration" : "urgency";
      await sendSlackAlert(p.userId, p.botId, p.sessionId, alertType, blocks);
      break;
    }

    // conversation.started has no Slack alert type
    default:
      break;
  }
}
