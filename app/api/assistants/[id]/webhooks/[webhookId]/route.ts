import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';

export async function PATCH(
  req: Request,
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

  const updates = await req.json();
  const allowed = ['name', 'action', 'endpoint_url', 'secret_key', 'is_active'];
  const patch = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  const { data, error } = await client
    .from('agent_webhooks')
    .update(patch)
    .eq('id', webhookId)
    .eq('assistant_id', assistantId)
    .eq('user_id', effectiveUserId)
    .select('id, name, action, endpoint_url, is_active')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ webhook: data });
}

export async function DELETE(
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

  const { error } = await client
    .from('agent_webhooks')
    .delete()
    .eq('id', webhookId)
    .eq('assistant_id', assistantId)
    .eq('user_id', effectiveUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
