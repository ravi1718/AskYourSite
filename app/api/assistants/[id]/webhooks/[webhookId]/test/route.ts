import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';
import crypto from 'crypto';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  const { id: assistantId, webhookId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const admin = getSupabaseAdminClient();
  const client = admin ?? supabase;

  const { data: webhook } = await client
    .from('agent_webhooks')
    .select('*')
    .eq('id', webhookId)
    .eq('assistant_id', assistantId)
    .eq('user_id', effectiveUserId)
    .single();

  if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });

  const testPayload = {
    action: webhook.action,
    reason: 'Manual test from AskYourSite dashboard',
    timestamp: Date.now(),
    data: {
      user_intent: 'test',
      user_message: 'This is a test webhook from AskYourSite',
      priority: 'low',
      session_id: 'test_session',
      assistant_id: assistantId,
    },
  };

  const body = JSON.stringify(testPayload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-AYS-Action': webhook.action,
    'X-AYS-Version': '1',
  };

  if (webhook.secret_key) {
    const sig = crypto.createHmac('sha256', webhook.secret_key).update(body).digest('hex');
    headers['X-AYS-Signature'] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(webhook.endpoint_url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    });
    return NextResponse.json({ success: res.ok, status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Request failed' });
  }
}
