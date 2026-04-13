import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assistantId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership via join — only return runs for workflows the user owns
  const { data, error } = await supabase
    .from('workflow_runs')
    .select(`
      id,
      status,
      current_step,
      next_run_at,
      started_at,
      completed_at,
      visitor_email,
      trigger_payload,
      agent_workflows!inner ( id, name, steps, user_id )
    `)
    .eq('assistant_id', assistantId)
    .eq('agent_workflows.user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten the join
  const runs = (data || []).map((r: any) => ({
    id: r.id,
    status: r.status,
    current_step: r.current_step,
    next_run_at: r.next_run_at,
    started_at: r.started_at,
    completed_at: r.completed_at,
    visitor_email: r.visitor_email,
    total_steps: r.agent_workflows?.steps?.length ?? 0,
    workflow_id: r.agent_workflows?.id,
    workflow_name: r.agent_workflows?.name,
  }));

  return NextResponse.json({ runs });
}
