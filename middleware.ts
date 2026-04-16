import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { WORKSPACE_COOKIE, MEMBER_ROLE_COOKIE } from "@/lib/workspace";

const INACTIVITY_SECONDS = 7200; // 2 hours
const ACTIVITY_COOKIE = "ays-last-active";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard") && user) {
    const now = Math.floor(Date.now() / 1000);
    const lastActiveRaw = request.cookies.get(ACTIVITY_COOKIE)?.value;
    const lastActive = lastActiveRaw ? parseInt(lastActiveRaw, 10) : null;

    if (lastActive !== null && now - lastActive > INACTIVITY_SECONDS) {
      return NextResponse.redirect(new URL("/auth/signout", request.url));
    }

    // Stamp current activity time — set on the existing response to preserve Supabase cookies
    response.cookies.set(ACTIVITY_COOKIE, String(now), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });

    // ── Team workspace detection ─────────────────────────────────────────────
    // Only query on the first dashboard access per session (when cookie is absent).
    // The cookie persists for the browser session, so this runs at most once.
    const hasWorkspaceCookie = request.cookies.has(WORKSPACE_COOKIE);
    if (!hasWorkspaceCookie) {
      try {
        const admin = getSupabaseAdminClient();
        if (admin) {
          const { data: membership } = await admin
            .from("team_members")
            .select("workspace_owner_id, role")
            .eq("member_user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

          if (membership) {
            // This user is a team member — point them at the admin's workspace
            response.cookies.set(WORKSPACE_COOKIE, membership.workspace_owner_id, {
              httpOnly: true,
              path: "/",
              sameSite: "lax",
            });
            response.cookies.set(MEMBER_ROLE_COOKIE, membership.role, {
              httpOnly: true,
              path: "/",
              sameSite: "lax",
            });
          } else {
            // Not a team member — clear any stale workspace cookies
            response.cookies.delete(WORKSPACE_COOKIE);
            response.cookies.delete(MEMBER_ROLE_COOKIE);
          }
        }
      } catch {
        // Non-fatal: fall back to own workspace if lookup fails
      }
    }
  }

  return response;
}

export const config = {
  // /live-chat/* is excluded — it uses join-token auth only (no session required)
  matcher: ["/dashboard/:path*", "/login", "/auth/callback"],
};
