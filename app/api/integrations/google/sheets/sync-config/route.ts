import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId, selectedResources = [] } = await req.json();
  if (!botId) return NextResponse.json({ error: "botId required" }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: bot } = await admin
    .from("assistants").select("id, user_id").eq("id", botId).single();
  if (!bot || bot.user_id !== user.id) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  await admin.from("google_sheets_sync_configs").upsert(
    {
      bot_id: botId,
      user_id: user.id,
      selected_sheets: selectedResources,
      next_sync_at: new Date().toISOString(),
      status: "active",
    },
    { onConflict: "bot_id" }
  );

  return NextResponse.json({ ok: true });
}
