import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const VALID_EVENTS = [
  "lead.captured",
  "conversation.started",
  "question.unanswered",
  "booking.confirmed",
  "intent.detected",
] as const;

// POST /api/zapier/hooks/subscribe
// Zapier calls this when a user turns on a Zap.
// Body: { target_url, trigger_event, bot_id? }
export async function POST(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.target_url || !body?.trigger_event) {
    return NextResponse.json({ error: "target_url and trigger_event are required" }, { status: 400 });
  }

  if (!VALID_EVENTS.includes(body.trigger_event)) {
    return NextResponse.json({ error: "Invalid trigger_event" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data, error } = await admin
    .from("zapier_subscriptions")
    .insert({
      user_id: auth.userId,
      bot_id: body.bot_id ?? null,
      trigger_event: body.trigger_event,
      target_url: body.target_url,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
