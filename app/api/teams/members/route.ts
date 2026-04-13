import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /api/teams/members — list the workspace owner's team members
export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { data: members, error } = await admin
    .from("team_members")
    .select("id, email, role, status, joined_at, created_at, member_user_id")
    .eq("workspace_owner_id", user.id)
    .neq("status", "removed")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with profile names for accepted members
  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      if (!m.member_user_id) return { ...m, name: null };
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", m.member_user_id)
        .maybeSingle();
      return { ...m, name: (profile as any)?.full_name ?? null };
    })
  );

  return NextResponse.json({ members: enriched });
}

// DELETE /api/teams/members?id=uuid — remove a member
export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Member id is required" }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Verify the member belongs to this admin's workspace
  const { data: member } = await admin
    .from("team_members")
    .select("id")
    .eq("id", id)
    .eq("workspace_owner_id", user.id)
    .maybeSingle();

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const { error } = await admin
    .from("team_members")
    .update({ status: "removed", invitation_token: null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
