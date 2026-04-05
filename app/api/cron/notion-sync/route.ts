import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncNotionConfig } from "@/lib/notion/sync";

// GET/POST /api/cron/notion-sync
// Called hourly by Vercel cron (vercel.json) or manually with CRON_SECRET.
// Processes all notion_sync_configs where next_sync_at <= NOW().
export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.get("Authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: configs } = await admin
    .from("notion_sync_configs")
    .select("id, bot_id, user_id")
    .eq("status", "active")
    .lte("next_sync_at", new Date().toISOString());

  if (!configs?.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  console.log(`[Notion Cron] Processing ${configs.length} sync configs`);

  // Process sequentially to avoid overwhelming the Notion API
  let processed = 0;
  for (const config of configs) {
    try {
      await syncNotionConfig(config.id);
      processed++;
    } catch (err) {
      console.error(`[Notion Cron] Failed for config ${config.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
