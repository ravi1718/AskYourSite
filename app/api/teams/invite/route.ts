import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://askyoursite.in";

function generateInviteToken(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

function inviteEmailHtml(inviterName: string, role: string, acceptUrl: string): string {
  const roleLabel = role === "editor" ? "Editor" : "Viewer";
  const roleDesc =
    role === "editor"
      ? "You'll be able to train assistants, configure their design and behavior, and test them."
      : "You'll be able to preview and test assistants in read-only mode.";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:32px;text-align:center;">
          <a href="${APP_URL}" style="text-decoration:none;">
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">⚡ AskYourSite</span>
          </a>
        </td></tr>
        <tr><td style="background:#111827;border:1px solid #1e293b;border-radius:16px;padding:40px 36px;">
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#f8fafc;line-height:1.2;">You've been invited to join a team</h1>
          <p style="margin:0 0 12px;font-size:15px;color:#94a3b8;line-height:1.6;">
            <strong style="color:#f8fafc;">${inviterName}</strong> has invited you to collaborate on their AskYourSite workspace as an <strong style="color:#f8fafc;">${roleLabel}</strong>.
          </p>
          <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">${roleDesc}</p>
          <a href="${acceptUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:100px;">
            Accept Invitation →
          </a>
          <p style="margin:28px 0 0;font-size:12px;color:#475569;line-height:1.6;">
            This invitation expires in 7 days. If you didn't expect this, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">AskYourSite · <a href="${APP_URL}" style="color:#3b82f6;">${APP_URL}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { email, role } = body as { email?: string; role?: string };

  if (!email || !role || !["editor", "viewer"].includes(role)) {
    return NextResponse.json({ error: "email and role (editor|viewer) are required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check the inviter's plan — only Pro/Business can invite
  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: user.id } as any)
    .single();
  const usage = usageData as any;
  const planCode: string = usage?.plan_code ?? "starter";
  const teamMemberLimit: number = usage?.team_member_limit ?? 0;
  const teamMemberCount: number = usage?.team_member_count ?? 0;

  if (teamMemberLimit === 0) {
    return NextResponse.json(
      { error: "Team collaboration requires a Pro or Business plan. Please upgrade to invite members." },
      { status: 403 }
    );
  }

  // Count includes the admin themselves; limit is total seats
  if (teamMemberCount + 1 >= teamMemberLimit) {
    return NextResponse.json(
      { error: `Your ${planCode} plan allows up to ${teamMemberLimit} team members (including you). Please upgrade to add more.` },
      { status: 403 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Check if this email is already a member (active or pending)
  const { data: existing } = await admin
    .from("team_members")
    .select("id, status")
    .eq("workspace_owner_id", user.id)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing && existing.status !== "removed") {
    return NextResponse.json(
      { error: "This email address is already a member or has a pending invitation." },
      { status: 409 }
    );
  }

  // Generate invitation token
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Upsert — re-invite a previously removed member
  const { error: insertError } = await admin.from("team_members").upsert(
    {
      workspace_owner_id: user.id,
      email: normalizedEmail,
      role,
      status: "pending",
      invitation_token: token,
      token_expires_at: expiresAt,
      invited_by: user.id,
      member_user_id: null,
      joined_at: null,
    },
    { onConflict: "workspace_owner_id,email" }
  );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Get inviter's display name
  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("full_name, company_name, email")
    .eq("id", user.id)
    .maybeSingle();
  const inviterName =
    (inviterProfile as any)?.company_name ||
    (inviterProfile as any)?.full_name ||
    (inviterProfile as any)?.email ||
    "Someone";

  // Send invitation email
  const acceptUrl = `${APP_URL}/invite/accept?token=${token}`;
  await sendEmail(
    normalizedEmail,
    `${inviterName} invited you to join their AskYourSite workspace`,
    inviteEmailHtml(inviterName, role, acceptUrl)
  );

  return NextResponse.json({ success: true, message: `Invitation sent to ${normalizedEmail}` });
}
