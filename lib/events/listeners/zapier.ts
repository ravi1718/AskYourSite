import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AysEvent, EventName } from "../types";

/**
 * Zapier REST hook listener — when an event fires, find all active Zapier
 * subscriptions for that user + trigger_event and POST the payload to each.
 * Gracefully no-ops until the zapier_subscriptions migration is applied.
 */
export async function handleZapierEvent<T extends EventName>(
  event: T,
  payload: AysEvent[T]
): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  const p = payload as any;
  const userId = p.userId as string;

  const { data: subs, error } = await admin
    .from("zapier_subscriptions")
    .select("id, target_url")
    .eq("user_id", userId)
    .eq("trigger_event", event)
    .eq("is_active", true);

  if (error || !subs?.length) return;

  // Check per-assistant zapierEnabled opt-in
  const botId = p.botId as string | undefined;
  if (botId) {
    const { data: assistantRow } = await admin
      .from("assistants")
      .select("widget_config")
      .eq("id", botId)
      .single();
    if (assistantRow?.widget_config?.zapierEnabled === false) return;
  }

  await Promise.allSettled(
    subs.map((sub) => postWithRetry(sub.target_url, { event, ...payload }))
  );
}

async function postWithRetry(url: string, body: object, attempt = 0): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 410) {
      // Zapier unsubscribed — we'd ideally deactivate, but without the sub ID here
      // Zapier will handle re-subscription on their end
      return;
    }

    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, delay));
      return postWithRetry(url, body, attempt + 1);
    }
  } catch (err) {
    if (attempt < 2) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      return postWithRetry(url, body, attempt + 1);
    }
    console.error("[Zapier] Failed to deliver webhook after retries:", err);
  }
}
