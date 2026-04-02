import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { trialExpiringEmail, trialExpiredEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Protect with CRON_SECRET so only Vercel Cron (or manual calls with the header) can trigger this
  console.log("CRON_SECRET:", process.env.CRON_SECRET);
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return new Response("No admin client", { status: 500 });

  const now = new Date();

  // Fetch all trialing subscriptions with profile data
  const { data: subs, error } = await admin
    .from("user_subscriptions")
    .select("user_id, current_period_end, profiles(email, full_name)")
    .eq("status", "trialing");

  if (error) {
    console.error("[cron/trial-reminders] DB error:", error);
    return new Response("DB error", { status: 500 });
  }

  let sent3day = 0;
  let sent1day = 0;
  let sentExpired = 0;

  for (const sub of subs ?? []) {
    const profile = sub.profiles as any;
    const email: string | undefined = profile?.email;
    const name: string = profile?.full_name ?? "there";
    if (!email) continue;

    const end = new Date(sub.current_period_end);
    const msLeft = end.getTime() - now.getTime();
    const hoursLeft = msLeft / (1000 * 60 * 60);

    // 3-day warning: between 71h and 73h remaining (±1h window around 72h)
    if (hoursLeft > 71 && hoursLeft <= 73) {
      await sendEmail(email, "Your AskYourSite trial ends in 3 days ⏰", trialExpiringEmail(name, 3));
      sent3day++;
    }
    // 1-day warning: between 23h and 25h remaining
    else if (hoursLeft > 23 && hoursLeft <= 25) {
      await sendEmail(email, "Last day of your AskYourSite free trial ⚠️", trialExpiringEmail(name, 1));
      sent1day++;
    }
    // Just expired: between -1h and 0h (within the last hour)
    else if (hoursLeft > -1 && hoursLeft <= 0) {
      await sendEmail(email, "Your AskYourSite free trial has ended", trialExpiredEmail(name));
      sentExpired++;
    }
  }

  console.log(`[cron/trial-reminders] 3-day: ${sent3day}, 1-day: ${sent1day}, expired: ${sentExpired}`);
  return Response.json({ sent3day, sent1day, sentExpired });
}
