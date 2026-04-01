import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const cookieStore = await cookies();
  const nextCookie = cookieStore.get("ays-login-next")?.value;
  const next = nextCookie ? decodeURIComponent(nextCookie) : "/dashboard";

  let isNewUser = false;
  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase?.auth.exchangeCodeForSession(code);
    const { data: { user } } = await supabase!.auth.getUser();
    if (user?.created_at) {
      const ageMs = Date.now() - new Date(user.created_at).getTime();
      isNewUser = ageMs < 30_000;
    }
  }

  const redirectUrl = new URL(next, requestUrl.origin);
  if (isNewUser) redirectUrl.searchParams.set("welcome", "1");
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.delete("ays-last-active");
  res.cookies.delete("ays-login-next");
  return res;
}
