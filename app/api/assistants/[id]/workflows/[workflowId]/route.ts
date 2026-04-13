import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const ALLOWED_FIELDS = ['name', 'trigger_action', 'steps', 'is_active'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; workflowId: string }> }
) {
  const { id: assistantId, workflowId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('agent_workflows')
    .update(patch)
    .eq('id', workflowId)
    .eq('assistant_id', assistantId)
    .eq('user_id', user.id)
    .select('id, name, trigger_action, steps, is_active, run_count, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workflow: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; workflowId: string }> }
) {
  const { id: assistantId, workflowId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('agent_workflows')
    .delete()
    .eq('id', workflowId)
    .eq('assistant_id', assistantId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
