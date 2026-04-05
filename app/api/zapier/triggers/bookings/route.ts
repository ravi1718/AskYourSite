import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /api/zapier/triggers/bookings?since=ISO
// Returns confirmed bookings for this user's bots, newest first.
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

  let query = admin
    .from("bookings")
    .select("id, assistant_id, invitee_name, invitee_email, meeting_title, meeting_time, calendly_event_url, created_at")
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
    invitee_name: row.invitee_name,
    invitee_email: row.invitee_email,
    meeting_title: row.meeting_title,
    meeting_time: row.meeting_time,
    calendly_event_url: row.calendly_event_url,
    booked_at: row.created_at,
  }));

  return NextResponse.json(results);
}
