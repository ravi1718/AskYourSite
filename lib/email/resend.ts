import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "AskYourSite <hello@askyoursite.in>";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email:", subject);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[email] Resend error:", subject, error);
    else console.log("[email] Sent:", subject, "→", to);
  } catch (err) {
    console.error("[email] Failed to send:", subject, err);
  }
}
