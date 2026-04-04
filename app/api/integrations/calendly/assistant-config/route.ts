import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.assistantId) {
    return NextResponse.json({ error: "Missing assistantId" }, { status: 400 });
  }

  const { assistantId, calendlyEnabled, calendlyEventTypeUrl, calendlyEventTypeName } = body;

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Verify assistant belongs to this user
  const { data: assistant } = await admin
    .from("assistants")
    .select("id, widget_config")
    .eq("id", assistantId)
    .eq("user_id", user.id)
    .single();

  if (!assistant) {
    return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
  }

  const updatedConfig = {
    ...(assistant.widget_config ?? {}),
    calendlyEnabled: Boolean(calendlyEnabled),
    calendlyEventTypeUrl: calendlyEventTypeUrl ?? "",
    calendlyEventTypeName: calendlyEventTypeName ?? "",
  };

  const { error } = await admin
    .from("assistants")
    .update({ widget_config: updatedConfig, updated_at: new Date().toISOString() })
    .eq("id", assistantId);

  if (error) {
    return NextResponse.json({ error: "Failed to update assistant config" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
