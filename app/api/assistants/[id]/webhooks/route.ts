import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';
import crypto from 'crypto';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: assistantId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const admin = getSupabaseAdminClient();
  const client = admin ?? supabase;

  const { data, error } = await client
    .from('agent_webhooks')
    .select('id, name, action, endpoint_url, is_active, last_triggered_at, trigger_count, created_at')
    .eq('assistant_id', assistantId)
    .eq('user_id', effectiveUserId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ webhooks: data });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: assistantId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const admin = getSupabaseAdminClient();
  const client = admin ?? supabase;

  const { name, action, endpoint_url, secret_key } = await req.json();
  if (!name || !action || !endpoint_url) {
    return NextResponse.json({ error: 'name, action, and endpoint_url are required' }, { status: 400 });
  }

  const { data, error } = await client
    .from('agent_webhooks')
    .insert({ assistant_id: assistantId, user_id: effectiveUserId, name, action, endpoint_url, secret_key: secret_key || null })
    .select('id, name, action, endpoint_url, is_active, trigger_count, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ webhook: data }, { status: 201 });
}

/** Utility: generate a webhook secret (used by the UI "Generate" button) */
export async function OPTIONS() {
  const secret = 'whsec_' + crypto.randomBytes(24).toString('base64url');
  return NextResponse.json({ secret });
}
