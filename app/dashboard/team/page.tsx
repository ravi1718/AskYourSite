import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { TeamPageClient } from "./team-client";

export default async function TeamPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user || !supabase) redirect("/login");

  const workspace = await getWorkspaceContext();
  const isTeamMember = workspace?.isTeamMember ?? false;
  const admin = getSupabaseAdminClient();

  // ── Team member view (read-only): show the workspace they belong to ──────
  if (isTeamMember && workspace?.teamWorkspaceOwnerId) {
    let members: any[] = [];
    if (admin) {
      const { data } = await admin
        .from("team_members")
        .select("id, email, role, status, joined_at, created_at, member_user_id")
        .eq("workspace_owner_id", workspace.teamWorkspaceOwnerId)
        .neq("status", "removed")
        .order("created_at", { ascending: true });

      members = await Promise.all(
        (data ?? []).map(async (m: any) => {
          if (!m.member_user_id) return { ...m, name: null };
          const { data: profile } = await admin
            .from("profiles")
            .select("full_name")
            .eq("id", m.member_user_id)
            .maybeSingle();
          return { ...m, name: (profile as any)?.full_name ?? null };
        })
      );
    }

    // Fetch owner profile for context
    let ownerEmail = "";
    if (admin) {
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", workspace.teamWorkspaceOwnerId)
        .maybeSingle();
      ownerEmail = (ownerProfile as any)?.company_name || (ownerProfile as any)?.full_name || "Admin";
    }

    return (
      <TeamPageClient
        members={members}
        planCode=""
        teamMemberLimit={0}
        upgradeRequired={false}
        isReadOnly
        ownerLabel={ownerEmail}
      />
    );
  }

  // ── Admin view: full management ──────────────────────────────────────────

  // Check plan — only Pro/Business can use teams
  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: user.id } as any)
    .single();
  const usage = usageData as any;
  const planCode: string = usage?.plan_code ?? "starter";
  const teamMemberLimit: number = usage?.team_member_limit ?? 0;

  if (teamMemberLimit === 0) {
    return (
      <TeamPageClient
        members={[]}
        planCode={planCode}
        teamMemberLimit={0}
        upgradeRequired
      />
    );
  }

  let members: any[] = [];
  if (admin) {
    const { data } = await admin
      .from("team_members")
      .select("id, email, role, status, joined_at, created_at, member_user_id")
      .eq("workspace_owner_id", user.id)
      .neq("status", "removed")
      .order("created_at", { ascending: true });

    members = await Promise.all(
      (data ?? []).map(async (m: any) => {
        if (!m.member_user_id) return { ...m, name: null };
        const { data: profile } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", m.member_user_id)
          .maybeSingle();
        return { ...m, name: (profile as any)?.full_name ?? null };
      })
    );
  }

  return (
    <TeamPageClient
      members={members}
      planCode={planCode}
      teamMemberLimit={teamMemberLimit}
      upgradeRequired={false}
    />
  );
}
