import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates";

async function fireWelcomeEmail(userId: string, email: string, name: string) {
  try {
    const admin = getSupabaseAdminClient();
    if (!admin) return;
    // Look up the user's trial plan
    const { data } = await admin
      .from("user_subscriptions")
      .select("status, current_period_start, current_period_end, subscription_plans(name)")
      .eq("user_id", userId)
      .single();
    const planName = (data?.subscription_plans as any)?.name ?? "Pro";
    const start = data?.current_period_start ? new Date(data.current_period_start) : new Date();
    const end = data?.current_period_end ? new Date(data.current_period_end) : new Date(Date.now() + 7 * 86400000);
    const trialDays = Math.round((end.getTime() - start.getTime()) / 86400000) || 7;
    await sendEmail(email, "Welcome to AskYourSite 🎉", welcomeEmail(name, trialDays, planName));
  } catch (err) {
    console.error("[email] fireWelcomeEmail error:", err);
  }
}

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

  // Fire welcome email for new signups (non-blocking)
  if (isNewUser && code) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase!.auth.getUser();
    if (user?.email) {
      fireWelcomeEmail(user.id, user.email, user.user_metadata?.full_name ?? user.user_metadata?.name ?? "there");
    }
  }

  const redirectUrl = new URL(next, requestUrl.origin);
  if (isNewUser) redirectUrl.searchParams.set("welcome", "1");
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.delete("ays-last-active");
  res.cookies.delete("ays-login-next");
  return res;
}
