import crypto from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { startWorkflowsForAction } from '@/lib/agent/workflow-executor';

export type AgentAction =
  | 'capture_lead'
  | 'book_demo'
  | 'recommend_product'
  | 'trigger_discount'
  | 'send_notification'
  | 'assign_human_agent'
  | 'update_crm'
  | 'track_event'
  | 'personalize_experience';

export interface ActionPayload {
  action: AgentAction;
  reason: string;
  data: {
    user_intent: string;
    user_message: string;
    context?: string;
    recommended_items?: string[];
    priority: 'low' | 'medium' | 'high';
    session_id: string;
    assistant_id: string;
    domain?: string;
  };
}

/** Extract agent action JSON from the AI response text */
export function parseAgentAction(text: string): ActionPayload | null {
  const match = text.match(/__AYS_AGENT_ACTION__([\s\S]+?)__\/AYS_AGENT_ACTION__/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as ActionPayload;
  } catch {
    return null;
  }
}

/** Strip the agent action marker from text before showing to user */
export function stripAgentAction(text: string): string {
  // First, remove complete tag pairs
  let cleaned = text.replace(/__AYS_AGENT_ACTION__[\s\S]+?__\/AYS_AGENT_ACTION__/g, '');
  // Also strip any orphaned opening tag (AI omitted the closing tag)
  cleaned = cleaned.replace(/__AYS_AGENT_ACTION__[\s\S]*$/g, '');
  return cleaned.trim();
}

/**
 * Fire outbound webhooks for a detected agent action.
 * Fully non-blocking — webhook failures never affect the chat response.
 */
export async function executeAgentAction(
  payload: ActionPayload,
  assistantId: string,
  sessionId: string
): Promise<void> {
  const db = getSupabaseAdminClient();
  if (!db) return;

  const { data: webhooks } = await db
    .from('agent_webhooks')
    .select('*')
    .eq('assistant_id', assistantId)
    .eq('action', payload.action)
    .eq('is_active', true);

  // Fire webhooks
  for (const webhook of (webhooks || [])) {
    fireWebhook(webhook, payload, assistantId, sessionId);
  }

  // Start any configured workflows for this action (fire-and-forget)
  startWorkflowsForAction(payload.action, assistantId, {
    action: payload.action,
    reason: payload.reason,
    visitor_email: undefined,
    session_id: sessionId,
    assistant_id: assistantId,
  }).catch(() => {});
}

async function fireWebhook(
  webhook: { id: string; endpoint_url: string; secret_key: string | null; trigger_count: number },
  payload: ActionPayload,
  assistantId: string,
  sessionId: string
): Promise<void> {
  const db = getSupabaseAdminClient();
  if (!db) return;

  const body = JSON.stringify({ ...payload, timestamp: Date.now() });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-AYS-Action': payload.action,
    'X-AYS-Version': '1',
  };

  if (webhook.secret_key) {
    const sig = crypto.createHmac('sha256', webhook.secret_key).update(body).digest('hex');
    headers['X-AYS-Signature'] = `sha256=${sig}`;
  }

  let responseStatus: number | null = null;
  try {
    const res = await fetch(webhook.endpoint_url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(8000),
    });
    responseStatus = res.status;
  } catch {
    // Timeout or network error — log as null status
  }

  // Log + update stats (both are best-effort, failures ignored)
  Promise.all([
    db.from('agent_action_log').insert({
      assistant_id: assistantId,
      session_id: sessionId,
      action: payload.action,
      trigger_reason: payload.reason,
      payload: payload.data,
      endpoint_url: webhook.endpoint_url,
      response_status: responseStatus,
    }),
    db
      .from('agent_webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: webhook.trigger_count + 1,
      })
      .eq('id', webhook.id),
  ]).catch(() => {});
}
