// GET /api/handoff/[token] — full session info + conversation history for live-chat page load.
// Auth: join token only (no dashboard session required).

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const db = getSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Validate token and check expiry
  const { data: handoff } = await db
    .from("handoff_sessions")
    .select(
      "id, assistant_id, session_id, status, trigger_reason, trigger_message, ai_summary, visitor_name, visitor_email, visitor_sentiment, claimed_by_user_id, claimed_at, join_token, token_expires_at, created_at, updated_at"
    )
    .eq("join_token", token)
    .maybeSingle();

  if (!handoff) return NextResponse.json({ error: "Invalid token" }, { status: 404 });

  if (new Date(handoff.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  // Fetch assistant name
  const { data: assistant } = await db
    .from("assistants")
    .select("name")
    .eq("id", handoff.assistant_id)
    .maybeSingle();

  // Fetch full conversation: visitor messages from chat_messages + agent from handoff_messages
  const [chatMsgs, handoffMsgs] = await Promise.all([
    db
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", handoff.session_id)
      .order("created_at", { ascending: true }),
    db
      .from("handoff_messages")
      .select("role, content, created_at")
      .eq("handoff_id", handoff.id)
      .order("created_at", { ascending: true }),
  ]);

  // Merge and sort chronologically
  const allMessages = [
    ...(chatMsgs.data ?? []).map((m: any) => ({ ...m, source: "chat" })),
    ...(handoffMsgs.data ?? []).map((m: any) => ({ ...m, source: "handoff" })),
  ].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return NextResponse.json({
    handoff: {
      ...handoff,
      assistantName: assistant?.name ?? "Assistant",
    },
    messages: allMessages,
  });
}
