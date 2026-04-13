import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/integrations/connected
 * Returns which integration providers are connected for the effective workspace owner.
 * Uses admin client so team members can see the admin's integrations.
 */
export async function GET() {
  const workspace = await getWorkspaceContext();
  if (!workspace) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ providers: [] });

  const { data } = await admin
    .from("user_integrations")
    .select("provider")
    .eq("user_id", workspace.effectiveUserId);

  return NextResponse.json({
    providers: (data ?? []).map((r: { provider: string }) => r.provider),
  });
}
