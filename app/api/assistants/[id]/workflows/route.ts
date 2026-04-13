import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: assistantId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('agent_workflows')
    .select('id, name, trigger_action, steps, is_active, run_count, created_at')
    .eq('assistant_id', assistantId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workflows: data });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: assistantId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, trigger_action, steps } = await req.json();
  if (!name || !trigger_action || !Array.isArray(steps)) {
    return NextResponse.json({ error: 'name, trigger_action, and steps[] are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('agent_workflows')
    .insert({ assistant_id: assistantId, user_id: user.id, name, trigger_action, steps })
    .select('id, name, trigger_action, steps, is_active, run_count, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workflow: data }, { status: 201 });
}
