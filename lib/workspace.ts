/**
 * Workspace context helpers.
 *
 * In a normal (non-team) session:
 *   effectiveUserId === currentUserId  (admin of their own workspace)
 *   memberRole === "admin"
 *   isTeamMember === false
 *
 * When a team member is logged in:
 *   effectiveUserId === the admin's user ID  (whose data to fetch)
 *   currentUserId   === the member's own user ID
 *   memberRole      === "editor" | "viewer"
 *   isTeamMember    === true
 *
 * Team membership is resolved via a direct DB query (admin client) — NOT via cookies.
 * Cookies are only used for the personal-workspace override toggle.
 */

import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type MemberRole = "admin" | "editor" | "viewer";

export interface WorkspaceContext {
  effectiveUserId: string;
  currentUserId: string;
  memberRole: MemberRole;
  isTeamMember: boolean;
  /** True when user is a known team member but has overridden to their personal workspace */
  isPersonalOverride: boolean;
  /** workspace_owner_id from team_members — present even when isPersonalOverride is true */
  teamWorkspaceOwnerId: string | null;
}

export const WORKSPACE_COOKIE = "ays-workspace-owner-id";
export const MEMBER_ROLE_COOKIE = "ays-member-role";
/** When set to "personal", forces personal workspace even for team members */
export const WORKSPACE_OVERRIDE_COOKIE = "ays-workspace-override";

/**
 * Resolves the workspace context for the currently authenticated user.
 *
 * Source of truth: live DB query via admin client.
 * The middleware cookies are a legacy layer kept for compatibility only.
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) return null;

  const cookieStore = await cookies();
  const workspaceOverride = cookieStore.get(WORKSPACE_OVERRIDE_COOKIE)?.value;

  // ── Primary: query team_members directly ─────────────────────────────────
  const admin = getSupabaseAdminClient();
  if (admin) {
    // Check for accepted membership first (fast path — user has already accepted invite)
    let { data: membership } = await admin
      .from("team_members")
      .select("workspace_owner_id, role")
      .eq("member_user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    // If not found by user ID, check for a pending invite matching their email.
    // This auto-accepts the invite so subsequent logins work without the email link.
    if (!membership && user.email) {
      const { data: pendingInvite } = await admin
        .from("team_members")
        .select("id, workspace_owner_id, role, token_expires_at")
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending")
        .maybeSingle();

      if (pendingInvite) {
        const isExpired = pendingInvite.token_expires_at
          ? new Date(pendingInvite.token_expires_at) < new Date()
          : false;

        if (!isExpired) {
          // Ensure profile exists
          const { data: existingProfile } = await admin
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();
          if (!existingProfile) {
            await admin.from("profiles").insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name ?? "",
            });
          }

          // Auto-accept the invite
          await admin
            .from("team_members")
            .update({
              status: "active",
              member_user_id: user.id,
              joined_at: new Date().toISOString(),
              invitation_token: null,
              token_expires_at: null,
            })
            .eq("id", pendingInvite.id);

          membership = {
            workspace_owner_id: pendingInvite.workspace_owner_id,
            role: pendingInvite.role,
          };
        }
      }
    }

    if (membership) {
      // User is a team member. Check if they've chosen personal override.
      if (workspaceOverride === "personal") {
        return {
          effectiveUserId: user.id,
          currentUserId: user.id,
          memberRole: "admin",
          isTeamMember: false,
          isPersonalOverride: true,
          teamWorkspaceOwnerId: membership.workspace_owner_id,
        };
      }

      return {
        effectiveUserId: membership.workspace_owner_id,
        currentUserId: user.id,
        memberRole: membership.role as MemberRole,
        isTeamMember: true,
        isPersonalOverride: false,
        teamWorkspaceOwnerId: membership.workspace_owner_id,
      };
    }
  } else {
    // ── Fallback: use middleware-set cookies if admin client is unavailable ──
    const workspaceOwnerId = cookieStore.get(WORKSPACE_COOKIE)?.value;
    const rawRole = cookieStore.get(MEMBER_ROLE_COOKIE)?.value;

    if (workspaceOwnerId && rawRole) {
      if (workspaceOverride === "personal") {
        return {
          effectiveUserId: user.id,
          currentUserId: user.id,
          memberRole: "admin",
          isTeamMember: false,
          isPersonalOverride: true,
          teamWorkspaceOwnerId: workspaceOwnerId,
        };
      }
      return {
        effectiveUserId: workspaceOwnerId,
        currentUserId: user.id,
        memberRole: rawRole as MemberRole,
        isTeamMember: true,
        isPersonalOverride: false,
        teamWorkspaceOwnerId: workspaceOwnerId,
      };
    }
  }

  // Not a team member — plain personal workspace
  return {
    effectiveUserId: user.id,
    currentUserId: user.id,
    memberRole: "admin",
    isTeamMember: false,
    isPersonalOverride: false,
    teamWorkspaceOwnerId: null,
  };
}

/**
 * Returns just the effective user ID — the most common use case.
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const ctx = await getWorkspaceContext();
  return ctx?.effectiveUserId ?? null;
}

/**
 * Returns the member role for the current user in the active workspace.
 */
export async function getMemberRole(): Promise<MemberRole | null> {
  const ctx = await getWorkspaceContext();
  return ctx?.memberRole ?? null;
}

/**
 * Checks whether the current user has permission to access a given tab.
 *
 *   admin  → full access
 *   editor → train, design, automate, preview (no install, no billing)
 *   viewer → preview only
 */
export function canAccess(
  role: MemberRole,
  tab: "preview" | "train" | "design" | "automate" | "install" | "billing"
): boolean {
  if (role === "admin") return true;
  if (role === "editor") return tab !== "install" && tab !== "billing";
  if (role === "viewer") return tab === "preview";
  return false;
}
