// POST /api/handoff/[token]/reply — agent sends a message to the visitor.
// Stored in handoff_messages. Widget polls /api/handoff/poll to receive it.

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const db = getSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Validate token and session state
  const { data: handoff } = await db
    .from("handoff_sessions")
    .select("id, status, token_expires_at")
    .eq("join_token", token)
    .maybeSingle();

  if (!handoff) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  if (new Date(handoff.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }
  if (handoff.status !== "active") {
    return NextResponse.json({ error: "Conversation is not active" }, { status: 409 });
  }

  const { error } = await db.from("handoff_messages").insert({
    handoff_id: handoff.id,
    sender_user_id: user?.id ?? null,
    role: "agent",
    content: content.trim(),
  });

  if (error) {
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }

  // Touch updated_at so poll endpoints see activity
  await db
    .from("handoff_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", handoff.id);

  return NextResponse.json({ success: true });
}
