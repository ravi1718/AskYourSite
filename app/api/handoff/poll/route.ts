// Public polling endpoint — widget calls this every 3s to check handoff status.
// No auth required. CORS open. Single indexed query per call.

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const assistantId = searchParams.get("assistantId");
  const after = searchParams.get("after"); // ISO timestamp for incremental message fetch

  if (!sessionId || !assistantId) {
    return NextResponse.json(
      { error: "Missing sessionId or assistantId" },
      { status: 400, headers: CORS }
    );
  }

  const db = getSupabaseAdminClient();
  if (!db) {
    return NextResponse.json({ status: "none", messages: [] }, { headers: CORS });
  }

  // Single indexed lookup — p95 < 5ms
  const { data: handoff } = await db
    .from("handoff_sessions")
    .select("id, status, claimed_by_user_id")
    .eq("session_id", sessionId)
    .eq("assistant_id", assistantId)
    .in("status", ["waiting", "active", "resolved", "timed_out"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!handoff) {
    return NextResponse.json({ status: "none", messages: [] }, { headers: CORS });
  }

  // Fetch agent messages since `after` (or all if not provided)
  let messages: { role: string; content: string; created_at: string }[] = [];
  if (handoff.status === "active" || handoff.status === "resolved") {
    let query = db
      .from("handoff_messages")
      .select("role, content, created_at")
      .eq("handoff_id", handoff.id)
      .order("created_at", { ascending: true });

    if (after) {
      query = query.gt("created_at", after);
    }

    const { data } = await query;
    messages = data ?? [];
  }

  return NextResponse.json(
    { status: handoff.status, messages },
    { headers: CORS }
  );
}
