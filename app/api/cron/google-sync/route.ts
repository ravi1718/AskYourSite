import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncGoogleDocsConfig } from "@/lib/google/sync-docs";
import { syncGoogleSheetsConfig } from "@/lib/google/sync-sheets";
import { syncGoogleDriveConfig } from "@/lib/google/sync-drive";

export const maxDuration = 60;

// GET /api/cron/google-sync
// Called by Vercel cron (vercel.json). Processes all pending Google sync configs.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const now = new Date().toISOString();

  const [docsRes, sheetsRes, driveRes] = await Promise.all([
    admin.from("google_docs_sync_configs").select("id").eq("status", "active").lte("next_sync_at", now),
    admin.from("google_sheets_sync_configs").select("id").eq("status", "active").lte("next_sync_at", now),
    admin.from("google_drive_sync_configs").select("id").eq("status", "active").lte("next_sync_at", now),
  ]);

  const results = { docs: 0, sheets: 0, drive: 0, errors: 0 };

  for (const c of docsRes.data ?? []) {
    try { await syncGoogleDocsConfig(c.id); results.docs++; }
    catch (e) { console.error("[Cron Google Docs] Error:", e); results.errors++; }
  }

  for (const c of sheetsRes.data ?? []) {
    try { await syncGoogleSheetsConfig(c.id); results.sheets++; }
    catch (e) { console.error("[Cron Google Sheets] Error:", e); results.errors++; }
  }

  for (const c of driveRes.data ?? []) {
    try { await syncGoogleDriveConfig(c.id); results.drive++; }
    catch (e) { console.error("[Cron Google Drive] Error:", e); results.errors++; }
  }

  return NextResponse.json({ ok: true, processed: results });
}
