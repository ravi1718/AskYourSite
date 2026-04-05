import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// POST /api/integrations/zapier/assistant-config
// Toggles zapierEnabled on an assistant's widget_config.
// Default is false — explicit opt-in required for Zapier events.
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assistantId, zapierEnabled } = await req.json();
  if (!assistantId || zapierEnabled === undefined) {
    return NextResponse.json({ error: "assistantId and zapierEnabled are required" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: assistant } = await admin
    .from("assistants")
    .select("id, user_id, widget_config")
    .eq("id", assistantId)
    .single();

  if (!assistant || assistant.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updatedConfig = { ...(assistant.widget_config ?? {}), zapierEnabled: Boolean(zapierEnabled) };

  await admin
    .from("assistants")
    .update({ widget_config: updatedConfig, updated_at: new Date().toISOString() })
    .eq("id", assistantId);

  return NextResponse.json({ ok: true });
}
