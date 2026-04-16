import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/handoff-timeout
 * Runs every 5 minutes (Vercel Cron).
 * Calls timeout_stale_handoffs() to mark 'waiting' sessions older than 30 min as 'timed_out'.
 * Widget polls and shows "AI is back online" message when it sees timed_out status.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { data, error } = await db.rpc("timeout_stale_handoffs");

  if (error) {
    console.error("[Cron] timeout_stale_handoffs failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const timedOut = typeof data === "number" ? data : 0;
  console.log(`[Cron] Timed out ${timedOut} stale handoff session(s)`);

  return NextResponse.json({ success: true, timedOut });
}
