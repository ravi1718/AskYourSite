// GET /api/handoff/[token]/messages?after=<ISO> — incremental agent message polling.
// Called every 3s by the live-chat agent view. Token auth only.

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  const db = getSupabaseAdminClient();
  if (!db) return NextResponse.json({ messages: [] });

  // Validate token
  const { data: handoff } = await db
    .from("handoff_sessions")
    .select("id, status, token_expires_at")
    .eq("join_token", token)
    .maybeSingle();

  if (!handoff || new Date(handoff.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  let query = db
    .from("handoff_messages")
    .select("role, content, created_at")
    .eq("handoff_id", handoff.id)
    .order("created_at", { ascending: true });

  if (after) {
    query = query.gt("created_at", after);
  }

  const { data: messages } = await query;

  // Also return latest visitor messages from chat_messages for the agent view
  let visitorQuery = db
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("session_id", handoff.id) // session_id linked through handoff
    .eq("role", "user")
    .order("created_at", { ascending: true });

  if (after) {
    visitorQuery = visitorQuery.gt("created_at", after);
  }

  // Get session_id from handoff to query chat_messages properly
  const { data: fullHandoff } = await db
    .from("handoff_sessions")
    .select("session_id")
    .eq("id", handoff.id)
    .single();

  let visitorMessages: any[] = [];
  if (fullHandoff?.session_id) {
    let vq = db
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", fullHandoff.session_id)
      .eq("role", "user")
      .order("created_at", { ascending: true });
    if (after) vq = vq.gt("created_at", after);
    const { data } = await vq;
    visitorMessages = data ?? [];
  }

  const all = [
    ...(messages ?? []).map((m: any) => ({ ...m, source: "handoff" })),
    ...visitorMessages.map((m: any) => ({ ...m, source: "chat" })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return NextResponse.json({ messages: all, handoffStatus: handoff.status });
}
