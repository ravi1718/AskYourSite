import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json().catch(() => ({}));

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  if (message.length > 5000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#000000;font-family:'IBM Plex Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;min-height:100vh;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #1C1C1C;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 24px;border-bottom:1px solid #1C1C1C;">
              <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#555555;font-weight:600;">New contact message</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#FAFAFA;letter-spacing:-0.3px;">AskYourSite</h1>
            </td>
          </tr>

          <!-- Sender info -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #1C1C1C;background:#050505;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:14px;">
                    <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#444444;font-weight:600;">From</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#FAFAFA;">${name}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#444444;font-weight:600;">Reply to</p>
                    <a href="mailto:${email}" style="font-size:16px;font-weight:600;color:#00D9FF;text-decoration:none;">${email}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:24px 32px 32px;">
              <p style="margin:0 0 12px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#444444;font-weight:600;">Message</p>
              <div style="background:#050505;border:1px solid #1C1C1C;border-radius:10px;padding:20px;">
                <p style="margin:0;font-size:15px;line-height:1.75;color:#888888;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              </div>
            </td>
          </tr>

          <!-- Reply CTA -->
          <tr>
            <td style="padding:0 32px 28px;">
              <a href="mailto:${email}?subject=Re: Your message to AskYourSite"
                style="display:inline-block;background:#00D9FF;color:#000000;font-size:13px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">
                Reply to ${name} →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1C1C1C;">
              <p style="margin:0;font-size:11px;color:#333333;">Sent via AskYourSite contact form · ravitej@askyoursite.in</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await sendEmail(
    "ravitej@askyoursite.in",
    `New message from ${name} <${email}>`,
    html
  );

  return NextResponse.json({ success: true });
}
