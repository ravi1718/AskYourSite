import { sendEmail } from "@/lib/email/resend";
import {
  welcomeEmail,
  trialExpiringEmail,
  trialExpiredEmail,
  subscriptionActivatedEmail,
  subscriptionRenewedEmail,
  subscriptionCancelledEmail,
  paymentFailedEmail,
} from "@/lib/email/templates";

// TEMPORARY — delete this file after testing
export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  if (!to) return new Response("Missing ?to=email param", { status: 400 });

  const results: string[] = [];

  const emails = [
    { subject: "Welcome to AskYourSite 🎉", html: welcomeEmail("Ravi", 7, "Pro") },
    { subject: "Your trial ends in 3 days ⏰", html: trialExpiringEmail("Ravi", 3) },
    { subject: "Last day of your free trial ⚠️", html: trialExpiringEmail("Ravi", 1) },
    { subject: "Your free trial has ended", html: trialExpiredEmail("Ravi") },
    { subject: "Your Pro plan is now active 🎉", html: subscriptionActivatedEmail("Ravi", "Pro", "May 2, 2025") },
    { subject: "AskYourSite subscription renewed", html: subscriptionRenewedEmail("Ravi", "Pro", "May 2, 2025") },
    { subject: "Your subscription has been cancelled", html: subscriptionCancelledEmail("Ravi") },
    { subject: "Action required: payment failed", html: paymentFailedEmail("Ravi", "Pro") },
  ];

  for (const { subject, html } of emails) {
    await sendEmail(to, subject, html);
    results.push(subject);
  }

  return Response.json({ sent: results.length, to, subjects: results });
}
