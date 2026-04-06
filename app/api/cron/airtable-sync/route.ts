import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncAirtableConfig } from "@/lib/airtable/sync";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: configs } = await admin
    .from("airtable_sync_configs")
    .select("id")
    .eq("status", "active")
    .lte("next_sync_at", new Date().toISOString());

  let processed = 0, errors = 0;
  for (const c of configs ?? []) {
    try { await syncAirtableConfig(c.id); processed++; }
    catch (e) { console.error("[Cron Airtable] Error:", e); errors++; }
  }

  return NextResponse.json({ ok: true, processed, errors });
}
