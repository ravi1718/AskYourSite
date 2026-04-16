// Dashboard inbox — returns waiting/active handoffs for the authenticated workspace.
// Called every 10s by InboxClient. Requires dashboard session.

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const db = getSupabaseAdminClient();
  if (!db) {
    return NextResponse.json({ handoffs: [] });
  }

  // Fetch assistant IDs owned by the effective user
  const { data: assistants } = await db
    .from("assistants")
    .select("id, name")
    .eq("user_id", effectiveUserId);

  if (!assistants || assistants.length === 0) {
    return NextResponse.json({ handoffs: [] });
  }

  const assistantIds = assistants.map((a: any) => a.id);
  const assistantNameMap = Object.fromEntries(
    assistants.map((a: any) => [a.id, a.name])
  );

  // Fetch waiting + active handoffs ordered by urgency (waiting first, then recency)
  const { data: handoffs } = await db
    .from("handoff_sessions")
    .select(
      "id, assistant_id, session_id, status, trigger_reason, trigger_message, ai_summary, visitor_name, visitor_email, visitor_sentiment, claimed_by_user_id, claimed_at, join_token, created_at, updated_at"
    )
    .in("assistant_id", assistantIds)
    .in("status", ["waiting", "active"])
    .order("status", { ascending: true }) // 'active' < 'waiting' alphabetically — swap below
    .order("created_at", { ascending: false })
    .limit(50);

  // Attach assistant names and sort: waiting first, then active, then by recency
  const enriched = (handoffs ?? [])
    .map((h: any) => ({ ...h, assistantName: assistantNameMap[h.assistant_id] ?? "Unknown" }))
    .sort((a: any, b: any) => {
      if (a.status === "waiting" && b.status !== "waiting") return -1;
      if (b.status === "waiting" && a.status !== "waiting") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return NextResponse.json({ handoffs: enriched });
}
