import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { dispatchEvent } from "@/lib/events/dispatch";

export async function POST(req: Request) {
  try {
    const { assistantId, sessionId } = await req.json();
    if (!assistantId || !sessionId) {
      return NextResponse.json({ error: "Missing assistantId or sessionId" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

    // Fetch assistant to get owner info
    const { data: assistant } = await admin
      .from("assistants")
      .select("user_id, name, widget_config")
      .eq("id", assistantId)
      .single();

    if (!assistant?.user_id) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }

    const eventTypeName: string =
      assistant.widget_config?.calendlyEventTypeName || "a meeting";

    // Fire booking.confirmed event (Slack alert handled by the listener)
    dispatchEvent("booking.confirmed", {
      userId: assistant.user_id,
      botId: assistantId,
      botName: assistant.name ?? "Your bot",
      meetingTitle: eventTypeName,
      meetingTime: new Date().toISOString(),
      inviteeName: "A visitor",
      inviteeEmail: "",
      calendlyEventUrl: assistant.widget_config?.calendlyEventTypeUrl ?? "",
      sessionId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[booking-confirmed]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
