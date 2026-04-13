import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: assistantId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('proactive_triggers')
    .select('id, name, trigger_type, condition_value, url_pattern, message, cooldown_hours, is_active, fire_count, created_at')
    .eq('assistant_id', assistantId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ triggers: data });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: assistantId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, trigger_type, condition_value, url_pattern, message, cooldown_hours } = await req.json();
  if (!name || !trigger_type || !message || !condition_value) {
    return NextResponse.json({ error: 'name, trigger_type, condition_value, and message are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('proactive_triggers')
    .insert({
      assistant_id: assistantId,
      user_id: user.id,
      name,
      trigger_type,
      condition_value,
      url_pattern: url_pattern || null,
      message,
      cooldown_hours: cooldown_hours ?? 24,
    })
    .select('id, name, trigger_type, condition_value, url_pattern, message, cooldown_hours, is_active, fire_count, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trigger: data }, { status: 201 });
}
