// POST /api/handoff/[token]/claim — agent claims a waiting conversation.
// Atomic UPDATE ensures only one agent can claim. Returns 409 if already claimed.

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  // Allow unauthenticated access via token (owner opens link from email without being logged in)
  // We still record claimed_by_user_id if a session exists
  const claimUserId = user?.id ?? null;

  const db = getSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Fetch and validate handoff
  const { data: handoff } = await db
    .from("handoff_sessions")
    .select("id, status, claimed_by_user_id, token_expires_at")
    .eq("join_token", token)
    .maybeSingle();

  if (!handoff) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  if (new Date(handoff.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  if (handoff.status !== "waiting") {
    // Already claimed or resolved — return current claimer info
    return NextResponse.json(
      {
        error: handoff.status === "active" ? "Already claimed" : "Conversation ended",
        claimedByUserId: handoff.claimed_by_user_id,
        status: handoff.status,
      },
      { status: 409 }
    );
  }

  // Atomic update: only succeeds if status is still 'waiting'
  const { data: updated, error } = await db
    .from("handoff_sessions")
    .update({
      status: "active",
      claimed_by_user_id: claimUserId,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", handoff.id)
    .eq("status", "waiting") // guard against race condition
    .select("id, status, claimed_by_user_id")
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.json(
      { error: "Could not claim — someone else may have just claimed it" },
      { status: 409 }
    );
  }

  // Insert system message so the agent view shows when the agent joined
  await db.from("handoff_messages").insert({
    handoff_id: handoff.id,
    role: "system",
    content: "Human joined the conversation.",
  });

  return NextResponse.json({ success: true, status: "active" });
}
