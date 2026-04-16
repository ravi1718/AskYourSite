// POST /api/handoff/[token]/resolve — agent closes the conversation.
// Widget will receive status='resolved' on next poll and re-enable the AI.

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const db = getSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { data: handoff } = await db
    .from("handoff_sessions")
    .select("id, status, token_expires_at")
    .eq("join_token", token)
    .maybeSingle();

  if (!handoff) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  if (new Date(handoff.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }
  if (handoff.status === "resolved" || handoff.status === "timed_out") {
    return NextResponse.json({ success: true, status: handoff.status });
  }

  await db
    .from("handoff_sessions")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", handoff.id);

  // System message so the timeline shows closure
  await db.from("handoff_messages").insert({
    handoff_id: handoff.id,
    role: "system",
    content: "Conversation resolved by agent. AI assistant is back online.",
  });

  return NextResponse.json({ success: true, status: "resolved" });
}
