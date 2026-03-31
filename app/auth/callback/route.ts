import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

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
  return NextResponse.redirect(redirectUrl);
}
