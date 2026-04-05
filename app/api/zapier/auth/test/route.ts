import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /api/zapier/auth/test — called by Zapier to verify the API key on connect
export async function GET(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", auth.userId)
    .single();

  const { data: usage } = await admin
    .rpc("get_user_usage", { p_user_id: auth.userId } as any)
    .single();

  return NextResponse.json({
    user_id: auth.userId,
    email: profile?.email ?? "",
    plan: (usage as any)?.plan_code ?? "starter",
  });
}
