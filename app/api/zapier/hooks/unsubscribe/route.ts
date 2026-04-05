import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// DELETE /api/zapier/hooks/unsubscribe
// Zapier calls this when a user turns off a Zap.
// Body: { target_url }
export async function DELETE(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.target_url) {
    return NextResponse.json({ error: "target_url is required" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  await admin
    .from("zapier_subscriptions")
    .update({ is_active: false })
    .eq("user_id", auth.userId)
    .eq("target_url", body.target_url);

  return NextResponse.json({ ok: true });
}
