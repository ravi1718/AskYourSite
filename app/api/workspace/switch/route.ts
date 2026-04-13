import { NextRequest, NextResponse } from "next/server";
import { WORKSPACE_OVERRIDE_COOKIE } from "@/lib/workspace";

/**
 * POST /api/workspace/switch
 * Body: { mode: "personal" | "team" }
 *
 * Sets or clears the workspace override cookie so team members who also have
 * a personal account can toggle between the two workspaces.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mode: string = body.mode;

  if (mode !== "personal" && mode !== "team") {
    return NextResponse.json({ error: "mode must be 'personal' or 'team'" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });

  if (mode === "personal") {
    res.cookies.set(WORKSPACE_OVERRIDE_COOKIE, "personal", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
  } else {
    res.cookies.delete(WORKSPACE_OVERRIDE_COOKIE);
  }

  return res;
}
