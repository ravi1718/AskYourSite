import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const { assistantId, sessionId, name, email, phone } = await req.json();

    if (!assistantId || !email) {
      return NextResponse.json(
        { error: "assistantId and email are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Verify the assistant exists and has lead capture enabled
    const { data: assistant, error: assistantError } = await supabase
      .from("assistants")
      .select("id, widget_config")
      .eq("id", assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    if (!assistant.widget_config?.leadCaptureEnabled) {
      return NextResponse.json(
        { error: "Lead capture not enabled for this assistant" },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const { error: insertError } = await supabase.from("leads").insert({
      assistant_id: assistantId,
      session_id: sessionId || crypto.randomUUID(),
      name: name || null,
      email,
      phone: phone || null,
    });

    if (insertError) {
      console.error("[Leads] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ success: true }, { status: 200, headers: CORS_HEADERS });
  } catch (err: any) {
    console.error("[Leads] Error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
