import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: assistantId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const admin = getSupabaseAdminClient();
  const client = admin ?? supabase;

  // Verify the assistant belongs to the workspace owner
  const { data: assistant } = await client
    .from('assistants')
    .select('id')
    .eq('id', assistantId)
    .eq('user_id', effectiveUserId)
    .single();

  if (!assistant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const action = url.searchParams.get('action');

  let query = client
    .from('agent_action_log')
    .select('id, action, trigger_reason, payload, endpoint_url, response_status, fired_at, session_id')
    .eq('assistant_id', assistantId)
    .order('fired_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) query = query.eq('action', action);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}
