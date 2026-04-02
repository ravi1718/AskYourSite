const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://askyoursite.in";

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <a href="${APP_URL}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">⚡ AskYourSite</span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#111827;border:1px solid #1e293b;border-radius:16px;padding:40px 36px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                AskYourSite · Turn your website into an AI Agent<br/>
                <a href="${APP_URL}" style="color:#3b82f6;text-decoration:none;">${APP_URL}</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#334155;">
                You're receiving this because you have an account at AskYourSite.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:28px;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:100px;letter-spacing:0.2px;">${label}</a>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#f8fafc;line-height:1.2;">${text}</h1>`;
}

function p(text: string, extra = ""): string {
  return `<p style="margin:0 0 14px;font-size:15px;color:#94a3b8;line-height:1.65;${extra}">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #1e293b;margin:28px 0;" />`;
}

function featureLine(icon: string, text: string): string {
  return `<tr>
    <td style="padding:6px 0;">
      <span style="font-size:14px;color:#94a3b8;">${icon}&nbsp; ${text}</span>
    </td>
  </tr>`;
}

// ─── 1. Welcome email ─────────────────────────────────────────────────────────
export function welcomeEmail(name: string, trialDays: number, planName: string): string {
  const body = `
    ${h1(`Welcome to AskYourSite, ${name}! 🎉`)}
    ${p(`You're all set. Your <strong style="color:#f8fafc;">${trialDays}-day free trial</strong> on the <strong style="color:#f8fafc;">${planName}</strong> plan has started — no credit card required.`)}
    ${p("Here's what you can do right now:")}
    <table cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
      ${featureLine("🤖", "Create your first AI chatbot")}
      ${featureLine("🌐", "Train it on your website or documents")}
      ${featureLine("💬", "Embed it on any page in seconds")}
      ${featureLine("📊", "Track conversations and capture leads")}
    </table>
    ${btn("Go to Dashboard →", `${APP_URL}/dashboard`)}
    ${divider()}
    ${p(`Your trial ends in <strong style="color:#f8fafc;">${trialDays} days</strong>. Upgrade anytime to keep everything running.`, "font-size:13px;")}
  `;
  return baseLayout("Welcome to AskYourSite", body);
}

// ─── 2. Trial expiring soon ───────────────────────────────────────────────────
export function trialExpiringEmail(name: string, daysLeft: number): string {
  const urgency = daysLeft === 1 ? "⚠️ Last day" : `⏰ ${daysLeft} days left`;
  const body = `
    ${h1(`${urgency} on your free trial`)}
    ${p(`Hey ${name}, your AskYourSite free trial expires in <strong style="color:#f8fafc;">${daysLeft} day${daysLeft === 1 ? "" : "s"}</strong>.`)}
    ${p("Upgrade now to keep your chatbots live and your data intact. Your conversations, leads, and settings are safe — just pick a plan and continue.")}
    ${btn("Upgrade Now →", `${APP_URL}/dashboard/billing`)}
    ${divider()}
    ${p("If you have any questions, just reply to this email — we're happy to help.", "font-size:13px;")}
  `;
  return baseLayout("Your AskYourSite trial is ending soon", body);
}

// ─── 3. Trial expired ─────────────────────────────────────────────────────────
export function trialExpiredEmail(name: string): string {
  const body = `
    ${h1("Your free trial has ended")}
    ${p(`Hey ${name}, your 7-day free trial on AskYourSite has expired.`)}
    ${p("Your chatbots are currently paused. Upgrade to any plan to reactivate them instantly — your data and settings are still safe.")}
    <table cellpadding="0" cellspacing="0" style="margin:4px 0 20px;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px 20px;width:100%;">
      ${featureLine("🚀", "<strong style='color:#f8fafc;'>Starter</strong> — 1 chatbot · 100 conversations/mo · $20/mo")}
      ${featureLine("⭐", "<strong style='color:#f8fafc;'>Pro</strong> — 5 chatbots · 1,000 conversations/mo")}
      ${featureLine("💼", "<strong style='color:#f8fafc;'>Business</strong> — 10 chatbots · 5,000 conversations/mo")}
    </table>
    ${btn("Choose a Plan →", `${APP_URL}/dashboard/billing`)}
    ${divider()}
    ${p("Questions? Reply to this email — we'd love to hear from you.", "font-size:13px;")}
  `;
  return baseLayout("Your AskYourSite trial has ended", body);
}

// ─── 4. Subscription activated ───────────────────────────────────────────────
export function subscriptionActivatedEmail(name: string, planName: string, nextBillingDate: string): string {
  const body = `
    ${h1(`You're now on the ${planName} plan ✅`)}
    ${p(`Hey ${name}, your subscription is active. Thank you for choosing AskYourSite!`)}
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;background:#1e293b;border:1px solid #1d4ed8;border-radius:12px;padding:20px 24px;width:100%;">
      ${featureLine("📦", `<strong style="color:#f8fafc;">Plan:</strong> ${planName}`)}
      ${featureLine("📅", `<strong style="color:#f8fafc;">Next billing:</strong> ${nextBillingDate}`)}
    </table>
    ${p("Your chatbots are fully active. Build, embed, and grow!")}
    ${btn("Go to Dashboard →", `${APP_URL}/dashboard`)}
    ${divider()}
    ${p("Manage your subscription anytime from the billing page.", "font-size:13px;")}
  `;
  return baseLayout(`${planName} subscription activated`, body);
}

// ─── 5. Subscription renewed ──────────────────────────────────────────────────
export function subscriptionRenewedEmail(name: string, planName: string, nextBillingDate: string): string {
  const body = `
    ${h1("Subscription renewed 🔄")}
    ${p(`Hey ${name}, your <strong style="color:#f8fafc;">${planName}</strong> subscription has been renewed.`)}
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;background:#1e293b;border:1px solid #1e293b;border-radius:12px;padding:20px 24px;width:100%;">
      ${featureLine("📦", `<strong style="color:#f8fafc;">Plan:</strong> ${planName}`)}
      ${featureLine("📅", `<strong style="color:#f8fafc;">Next renewal:</strong> ${nextBillingDate}`)}
    </table>
    ${p("Everything continues as normal — your chatbots are running and your data is safe.")}
    ${btn("View Dashboard →", `${APP_URL}/dashboard`)}
  `;
  return baseLayout("AskYourSite subscription renewed", body);
}

// ─── 6. Subscription cancelled ───────────────────────────────────────────────
export function subscriptionCancelledEmail(name: string): string {
  const body = `
    ${h1("Subscription cancelled")}
    ${p(`Hey ${name}, your AskYourSite subscription has been cancelled.`)}
    ${p("Your account has been moved to the free tier. Your existing data is safe, but your chatbots are currently paused.")}
    ${p("We'd love to have you back. If you change your mind, reactivating takes just a few clicks.")}
    ${btn("Reactivate Subscription →", `${APP_URL}/dashboard/billing`)}
    ${divider()}
    ${p("Was there something we could have done better? Reply to this email — your feedback genuinely helps us improve.", "font-size:13px;")}
  `;
  return baseLayout("Your AskYourSite subscription has been cancelled", body);
}

// ─── 7. Payment failed ────────────────────────────────────────────────────────
export function paymentFailedEmail(name: string, planName: string): string {
  const body = `
    ${h1("Payment failed ⚠️")}
    ${p(`Hey ${name}, we weren't able to process your payment for the <strong style="color:#f8fafc;">${planName}</strong> plan.`)}
    ${p("This can happen due to an expired card, insufficient funds, or a bank block. Please update your payment method to keep your chatbots running.")}
    ${btn("Update Payment Method →", `${APP_URL}/dashboard/billing`)}
    ${divider()}
    ${p("If you believe this is an error or need help, reply to this email and we'll sort it out.", "font-size:13px;")}
  `;
  return baseLayout("Action required: payment failed", body);
}
