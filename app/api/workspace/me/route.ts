import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace";

/**
 * GET /api/workspace/me
 * Returns the effective workspace user ID and plan for the current session.
 * Client components use this instead of calling supabase.auth.getUser() + get_user_usage directly,
 * so team members get the workspace owner's data.
 */
export async function GET() {
  const workspace = await getWorkspaceContext();
  if (!workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = getSupabaseAdminClient();
  let planCode = "starter";

  if (admin) {
    const { data } = await admin
      .rpc("get_user_usage", { p_user_id: workspace.effectiveUserId } as any)
      .single();
    planCode = (data as any)?.plan_code ?? "starter";
  }

  return NextResponse.json({
    effectiveUserId: workspace.effectiveUserId,
    currentUserId: workspace.currentUserId,
    isTeamMember: workspace.isTeamMember,
    planCode,
  });
}
