import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";

export type AlertType = "lead_captured" | "buying_intent" | "unanswered" | "booking_confirmed" | "frustration" | "urgency" | "handoff";

const TOGGLE_KEYS: Record<AlertType, string> = {
  lead_captured: "alert_new_lead",
  buying_intent: "alert_buying_intent",
  unanswered: "alert_unanswered",
  booking_confirmed: "alert_booking_confirmed",
  frustration: "alert_buying_intent",
  urgency: "alert_buying_intent",
  handoff: "alert_new_lead", // always fire when handoff is created (same gate as lead)
};

/**
 * Sends a Slack alert for the given user and alert type.
 * - Fetches the user's Slack integration from DB
 * - Checks the relevant alert toggle is enabled
 * - Checks rate limits / dedup via slack_alert_log
 * - Decrypts the webhook URL and POSTs the Block Kit blocks
 * - Handles Slack errors and retries
 * - Logs the sent alert to slack_alert_log
 *
 * This function is designed to run asynchronously after the main response
 * has been sent to the user. Call it with .catch() to prevent crash propagation.
 *
 * @param userId      The bot owner's user_id
 * @param assistantId The assistant that triggered the alert
 * @param sessionId   The chat session ID (used for per-session rate limiting)
 * @param alertType   One of: lead_captured | buying_intent | unanswered
 * @param blocks      Block Kit blocks array for the Slack message
 * @param dedupKey    Optional question_hash for unanswered 24h dedup
 */
export async function sendSlackAlert(
  userId: string,
  assistantId: string,
  sessionId: string,
  alertType: AlertType,
  blocks: object[],
  dedupKey?: string
): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  // 1. Fetch the user's active Slack integration
  const { data: integration } = await admin
    .from("user_integrations")
    .select("metadata")
    .eq("user_id", userId)
    .eq("provider", "slack")
    .single();

  if (!integration?.metadata?.webhook_url) return;
  const meta = integration.metadata as Record<string, any>;

  // 2. Check per-assistant opt-in (default: enabled if not explicitly set to false)
  const { data: assistantRow } = await admin
    .from("assistants")
    .select("widget_config")
    .eq("id", assistantId)
    .single();
  if (assistantRow?.widget_config?.slackEnabled === false) return;

  // 3. Check alert toggle
  if (!meta[TOGGLE_KEYS[alertType]]) return;

  // 4. Rate limit / dedup check
  const alreadySent = await checkAlreadySent(admin, userId, sessionId, alertType, dedupKey);
  if (alreadySent) return;

  // 5. Decrypt webhook URL and send
  let webhookUrl: string;
  try {
    webhookUrl = decrypt(meta.webhook_url);
  } catch {
    console.error("[Slack] Failed to decrypt webhook_url for user", userId);
    return;
  }

  const res = await postWithRetry(webhookUrl, { blocks });

  // 6. Handle permanently disabled webhook (channel deleted or app uninstalled)
  if (res.status === 404 || res.status === 410) {
    console.warn("[Slack] Webhook returned", res.status, "— marking integration inactive for user", userId);
    const cleanedMeta = { ...meta };
    delete cleanedMeta.webhook_url;
    await admin.from("user_integrations")
      .update({ metadata: cleanedMeta })
      .eq("user_id", userId)
      .eq("provider", "slack");
    return;
  }

  if (!res.ok) {
    console.error("[Slack] Webhook POST failed:", res.status, await res.text().catch(() => ""));
    return;
  }

  // 7. Log the sent alert (prevents duplicate sends)
  await admin.from("slack_alert_log").insert({
    user_id: userId,
    assistant_id: assistantId,
    session_id: sessionId,
    alert_type: alertType,
    question_hash: dedupKey ?? null,
  });
}

async function checkAlreadySent(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  userId: string,
  sessionId: string,
  alertType: AlertType,
  dedupKey?: string
): Promise<boolean> {
  if (alertType === "unanswered" && dedupKey) {
    // Unanswered: deduplicate per question per user per 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("slack_alert_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("alert_type", "unanswered")
      .eq("question_hash", dedupKey)
      .gte("sent_at", oneDayAgo);
    return (count ?? 0) > 0;
  }

  // lead_captured / buying_intent: max 1 per session
  const { count } = await admin
    .from("slack_alert_log")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("alert_type", alertType);
  return (count ?? 0) > 0;
}

async function postWithRetry(url: string, body: object, attempt = 0): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Slack rate limit: retry once after 1 second
  if (res.status === 429 && attempt === 0) {
    await delay(1000);
    return postWithRetry(url, body, 1);
  }

  // Slack server error: retry up to 2 times
  if (res.status >= 500 && attempt < 2) {
    await delay(2000);
    return postWithRetry(url, body, attempt + 1);
  }

  return res;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
