import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/visitors/[assistantId]?limit=50&offset=0
 * Returns visitor profiles for an assistant (authenticated, owner only).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  const { assistantId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const { data, error } = await supabase
    .from('visitor_profiles')
    .select('id, visitor_id, email, name, total_sessions, pages_visited, questions_asked, last_action, sentiment_avg, first_seen, last_seen')
    .eq('assistant_id', assistantId)
    .order('last_seen', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ visitors: data });
}
