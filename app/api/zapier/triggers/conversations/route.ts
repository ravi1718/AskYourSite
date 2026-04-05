import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /api/zapier/triggers/conversations?since=ISO
// Returns the first user message of each chat session for this user's bots, newest first.
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
  const botIds = assistants.map((a) => a.id);

  // Get first user message per session using a subquery approach:
  // fetch all user messages, then deduplicate by session_id keeping the earliest
  let query = admin
    .from("chat_messages")
    .select("id, assistant_id, session_id, content, created_at")
    .in("assistant_id", botIds)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(500);

  if (since) query = query.gte("created_at", since);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduplicate: keep earliest message per session (first message = conversation start)
  const seen = new Map<string, (typeof data)[number]>();
  for (const row of (data ?? []).slice().reverse()) {
    if (!seen.has(row.session_id)) {
      seen.set(row.session_id, row);
    }
  }

  const results = Array.from(seen.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 100)
    .map((row) => ({
      id: row.id,
      bot_id: row.assistant_id,
      bot_name: botMap[row.assistant_id] ?? "Unknown",
      first_message: row.content,
      session_id: row.session_id,
      started_at: row.created_at,
    }));

  return NextResponse.json(results);
}
