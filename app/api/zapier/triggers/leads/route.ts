import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /api/zapier/triggers/leads?since=ISO
// Returns leads captured by this user's bots, newest first.
export async function GET(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const since = req.nextUrl.searchParams.get("since");

  // Find all assistant IDs belonging to this user
  const { data: assistants } = await admin
    .from("assistants")
    .select("id, name")
    .eq("user_id", auth.userId);

  if (!assistants?.length) return NextResponse.json([]);

  const botMap = Object.fromEntries(assistants.map((a) => [a.id, a.name]));
  const botIds = assistants.map((a) => a.id);

  let query = admin
    .from("leads")
    .select("id, assistant_id, session_id, name, email, phone, created_at")
    .in("assistant_id", botIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (since) query = query.gte("created_at", since);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = (data ?? []).map((row) => ({
    id: row.id,
    bot_id: row.assistant_id,
    bot_name: botMap[row.assistant_id] ?? "Unknown",
    lead_name: row.name,
    lead_email: row.email,
    lead_phone: row.phone,
    session_id: row.session_id,
    captured_at: row.created_at,
  }));

  return NextResponse.json(results);
}
