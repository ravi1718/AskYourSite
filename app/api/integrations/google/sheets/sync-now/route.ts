import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncGoogleSheetsConfig } from "@/lib/google/sync-sheets";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await req.json();
  if (!botId) return NextResponse.json({ error: "botId required" }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: config } = await admin
    .from("google_sheets_sync_configs")
    .select("id")
    .eq("bot_id", botId)
    .eq("user_id", user.id)
    .single();

  if (!config) return NextResponse.json({ error: "No sync config found" }, { status: 404 });

  try {
    await syncGoogleSheetsConfig(config.id);
  } catch (e) {
    console.error("[Google Sheets] sync-now failed:", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Sync complete" });
}
