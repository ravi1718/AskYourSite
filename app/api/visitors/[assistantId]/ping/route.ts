import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * POST /api/visitors/[assistantId]/ping
 * Called by embed.js on each page load to upsert visitor profile.
 * No auth required — uses service role to bypass RLS.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  const { assistantId } = await params;
  const db = getSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  let body: { visitor_id?: string; page_url?: string; email?: string; name?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const { visitor_id, page_url, email, name } = body;
  if (!visitor_id) {
    return NextResponse.json({ error: 'visitor_id required' }, { status: 400 });
  }

  // Check if profile exists
  const { data: existing } = await db
    .from('visitor_profiles')
    .select('id, total_sessions, pages_visited')
    .eq('visitor_id', visitor_id)
    .eq('assistant_id', assistantId)
    .maybeSingle();

  if (existing) {
    // Update: increment sessions if new page load on a fresh session, add page
    const newPages = page_url && !existing.pages_visited.includes(page_url)
      ? [...existing.pages_visited, page_url].slice(-20) // keep last 20 pages
      : existing.pages_visited;

    const updates: Record<string, unknown> = {
      last_seen: new Date().toISOString(),
      pages_visited: newPages,
    };
    if (email) updates.email = email;
    if (name) updates.name = name;

    await db.from('visitor_profiles').update(updates).eq('id', existing.id);
  } else {
    // Insert new profile
    await db.from('visitor_profiles').insert({
      visitor_id,
      assistant_id: assistantId,
      email: email || null,
      name: name || null,
      total_sessions: 1,
      pages_visited: page_url ? [page_url] : [],
      questions_asked: [],
    });
  }

  return NextResponse.json({ ok: true }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
