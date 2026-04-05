import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { dispatchEvent } from "@/lib/events/dispatch";

// POST /api/integrations/calendly/webhook
// Receives Calendly webhook events (invitee.created = booking confirmed).
// Register this URL in your Calendly developer settings as a webhook endpoint.
//
// To verify authenticity in production, Calendly signs requests with
// CALENDLY_WEBHOOK_SIGNING_KEY — add that env var and verify below.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Only process booking confirmations
  if (body.event !== "invitee.created") {
    return NextResponse.json({ ok: true });
  }

  const payload = body.payload;
  const invitee = payload?.invitee ?? {};
  const event = payload?.event ?? {};

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  // Look up the AskYourSite user who owns this Calendly integration
  // Match by Calendly event URI → user_integrations.metadata.uri
  const calendlyUserUri = payload?.event_type?.owner ?? invitee?.tracking?.utm_source ?? null;

  // Try to find user by looking up event type URI in integrations metadata
  const { data: integrations } = await admin
    .from("user_integrations")
    .select("user_id, metadata")
    .eq("provider", "calendly");

  const match = (integrations ?? []).find((i: any) => {
    const meta = i.metadata ?? {};
    return meta.uri && calendlyUserUri && calendlyUserUri.includes(meta.uri);
  }) ?? (integrations ?? [])[0]; // fallback: first calendly user (single-tenant dev scenario)

  if (!match) {
    console.warn("[Calendly Webhook] Could not match event to a user");
    return NextResponse.json({ ok: true });
  }

  const userId = match.user_id;

  // Find the assistant that has Calendly enabled for this user
  const { data: assistant } = await admin
    .from("assistants")
    .select("id, name, user_id")
    .eq("user_id", userId)
    .filter("widget_config->>'calendlyEnabled'", "eq", "true")
    .limit(1)
    .single();

  const assistantId = assistant?.id ?? null;
  const botName = assistant?.name ?? "Your bot";

  const meetingTime = event.start_time ?? invitee.created_at;
  const meetingTitle = event.name ?? "Meeting";
  const inviteeName = invitee.name ?? "";
  const inviteeEmail = invitee.email ?? "";
  const calendlyEventUrl = invitee.uri ?? "";

  // Store in bookings table
  if (assistantId) {
    await admin.from("bookings").insert({
      assistant_id: assistantId,
      user_id: userId,
      session_id: invitee.tracking?.utm_content ?? null, // utm_content carries sessionId from embed
      invitee_name: inviteeName,
      invitee_email: inviteeEmail,
      meeting_title: meetingTitle,
      meeting_time: meetingTime,
      calendly_event_url: calendlyEventUrl,
    });
  }

  // Fire booking.confirmed event to all listeners (Slack + Zapier)
  dispatchEvent("booking.confirmed", {
    userId,
    botId: assistantId ?? userId,
    botName,
    meetingTime,
    meetingTitle,
    inviteeName,
    inviteeEmail,
    calendlyEventUrl,
    sessionId: invitee.tracking?.utm_content ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
