import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

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
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/auth/callback"],
};
