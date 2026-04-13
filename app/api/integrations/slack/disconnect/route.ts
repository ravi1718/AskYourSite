import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { getWorkspaceContext } from "@/lib/workspace";

export async function POST() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Fetch integration to get the token for revocation
  const { data: integration } = await admin
    .from("user_integrations")
    .select("access_token")
    .eq("user_id", effectiveUserId)
    .eq("provider", "slack")
    .single();

  // Best-effort token revocation — do not fail the disconnect if this errors
  if (integration?.access_token) {
    try {
      const token = decrypt(integration.access_token);
      await fetch("https://slack.com/api/auth.revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({ token }),
      });
    } catch {
      // Revocation failure is non-fatal
    }
  }

  // Delete the integration row
  await admin
    .from("user_integrations")
    .delete()
    .eq("user_id", effectiveUserId)
    .eq("provider", "slack");

  return NextResponse.json({ ok: true });
}
