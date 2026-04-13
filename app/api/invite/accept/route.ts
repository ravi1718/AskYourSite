import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// POST /api/invite/accept — accept a team invitation
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to accept an invitation." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { token } = body as { token?: string };
  if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Look up the invitation
  const { data: invite } = await admin
    .from("team_members")
    .select("id, email, role, status, token_expires_at, workspace_owner_id")
    .eq("invitation_token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite) {
    return NextResponse.json(
      { error: "This invitation link is invalid or has already been used." },
      { status: 404 }
    );
  }

  // Check expiry
  if (new Date(invite.token_expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This invitation has expired. Please ask the workspace admin to resend it." },
      { status: 410 }
    );
  }

  // The accepting user's email should match the invited email (security check)
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invitation was sent to ${invite.email}. Please sign in with that email address to accept it.` },
      { status: 403 }
    );
  }

  // Ensure acceptor has a profile row
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? "",
    });
  }

  // Accept the invitation
  const { error } = await admin
    .from("team_members")
    .update({
      status: "active",
      member_user_id: user.id,
      joined_at: new Date().toISOString(),
      invitation_token: null,
      token_expires_at: null,
    })
    .eq("id", invite.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    workspaceOwnerId: invite.workspace_owner_id,
    role: invite.role,
  });
}
