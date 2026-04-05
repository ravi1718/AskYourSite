import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /api/zapier/triggers/unanswered?since=ISO
// Returns unanswered questions logged for this user's bots, newest first.
export async function GET(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const since = req.nextUrl.searchParams.get("since");

  const { data: assistants } = await admin
    .from("assistants")
    .select("id, name")
    .eq("user_id", auth.userId);

  if (!assistants?.length) return NextResponse.json([]);

  const botMap = Object.fromEntries(assistants.map((a) => [a.id, a.name]));

  let query = admin
    .from("slack_alert_log")
    .select("id, assistant_id, session_id, question_hash, sent_at")
    .eq("user_id", auth.userId)
    .eq("alert_type", "unanswered")
    .order("sent_at", { ascending: false })
    .limit(100);

  if (since) query = query.gte("sent_at", since);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch the actual question text from chat_messages by session
  const sessionIds = [...new Set((data ?? []).map((r) => r.session_id).filter(Boolean))];
  let questionMap: Record<string, string> = {};
  if (sessionIds.length) {
    const { data: msgs } = await admin
      .from("chat_messages")
      .select("session_id, content")
      .in("session_id", sessionIds)
      .eq("role", "user")
      .order("created_at", { ascending: false });
    for (const m of msgs ?? []) {
      if (!questionMap[m.session_id]) questionMap[m.session_id] = m.content;
    }
  }

  const results = (data ?? []).map((row) => ({
    id: row.id,
    bot_id: row.assistant_id,
    bot_name: botMap[row.assistant_id] ?? "Unknown",
    question: questionMap[row.session_id] ?? "(question unavailable)",
    conversation_id: row.session_id,
    asked_at: row.sent_at,
  }));

  return NextResponse.json(results);
}
