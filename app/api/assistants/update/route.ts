import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { assistantId, userId, widgetConfig, welcomeMessage, tone, name } = await req.json();

    if (!assistantId || !userId) {
      return NextResponse.json({ error: "Missing assistantId or userId" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Admin client not initialized" }, { status: 500 });
    }

    // Verify ownership
    const { data: assistant } = await supabase
      .from("assistants")
      .select("id")
      .eq("id", assistantId)
      .eq("user_id", userId)
      .single();

    if (!assistant) {
      return NextResponse.json({ error: "Assistant not found or access denied" }, { status: 404 });
    }

    // Build update payload
    const updatePayload: Record<string, any> = {};
    if (widgetConfig !== undefined) updatePayload.widget_config = widgetConfig;
    if (welcomeMessage !== undefined) updatePayload.welcome_message = welcomeMessage;
    if (tone !== undefined) updatePayload.tone = tone;
    if (name !== undefined) updatePayload.name = name;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("assistants")
      .update(updatePayload)
      .eq("id", assistantId);

    if (error) {
      console.error("[Update Assistant] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Update Assistant] Fatal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
