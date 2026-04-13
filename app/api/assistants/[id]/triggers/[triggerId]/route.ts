import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; triggerId: string }> }
) {
  const { id: assistantId, triggerId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const admin = getSupabaseAdminClient();
  const client = admin ?? supabase;

  const updates = await req.json();
  const allowed = ['name', 'trigger_type', 'condition_value', 'url_pattern', 'message', 'cooldown_hours', 'is_active'];
  const patch = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  const { data, error } = await client
    .from('proactive_triggers')
    .update(patch)
    .eq('id', triggerId)
    .eq('assistant_id', assistantId)
    .eq('user_id', effectiveUserId)
    .select('id, name, trigger_type, condition_value, url_pattern, message, cooldown_hours, is_active, fire_count')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trigger: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; triggerId: string }> }
) {
  const { id: assistantId, triggerId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const admin = getSupabaseAdminClient();
  const client = admin ?? supabase;

  const { error } = await client
    .from('proactive_triggers')
    .delete()
    .eq('id', triggerId)
    .eq('assistant_id', assistantId)
    .eq('user_id', effectiveUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// Called fire-and-forget from embed.js when a trigger fires on the client
// Uses admin client — no auth required (public embed script)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; triggerId: string }> }
) {
  const { triggerId } = await params;
  const db = getSupabaseAdminClient();

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!db) return NextResponse.json({ error: 'Server error' }, { status: 500, headers: corsHeaders });

  const { error } = await db.rpc('increment_trigger_fire_count', { trigger_id: triggerId } as any);

  if (error) {
    // Fallback: manual increment if RPC doesn't exist
    const { data: current } = await db
      .from('proactive_triggers')
      .select('fire_count')
      .eq('id', triggerId)
      .single();

    await db
      .from('proactive_triggers')
      .update({ fire_count: (current?.fire_count ?? 0) + 1 })
      .eq('id', triggerId);
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
