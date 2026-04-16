import { sendEmail } from "@/lib/email/resend";
import type { HandoffTriggerReason } from "./detect-triggers";

const TRIGGER_LABELS: Record<HandoffTriggerReason, string> = {
  explicit_request: "Visitor explicitly requested a human agent",
  urgency: "Visitor signaled urgency (time-sensitive request)",
  frustration: "High frustration level detected across the conversation",
  unanswered_streak: "AI was unable to answer 2 or more consecutive questions",
  repeated_question: "Visitor repeated the same question 3+ times",
};

export async function sendHandoffNotificationEmail(params: {
  ownerEmail: string;
  assistantName: string;
  visitorName: string | null;
  visitorEmail: string | null;
  triggerReason: HandoffTriggerReason;
  aiSummary: string | null;
  joinToken: string;
  appBaseUrl: string;
}): Promise<void> {
  const {
    ownerEmail,
    assistantName,
    visitorName,
    visitorEmail,
    triggerReason,
    aiSummary,
    joinToken,
    appBaseUrl,
  } = params;

  const joinUrl = `${appBaseUrl}/live-chat/${joinToken}`;
  const visitorLabel = visitorName
    ? `${visitorName}${visitorEmail ? ` (${visitorEmail})` : ""}`
    : visitorEmail ?? "Anonymous visitor";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;">
              <p style="margin:0;color:#ddd6fe;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">AskYourSite · Live Support</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">
                Visitor Needs Human Support
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">

              <!-- Trigger reason -->
              <table cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;width:100%;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">⚠️ ${TRIGGER_LABELS[triggerReason]}</p>
                  </td>
                </tr>
              </table>

              <!-- Details -->
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0;width:140px;color:#64748b;font-size:14px;">Visitor</td>
                  <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${visitorLabel}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;">Assistant</td>
                  <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${assistantName}</td>
                </tr>
              </table>

              ${
                aiSummary
                  ? `
              <!-- AI Summary -->
              <div style="background:#f8fafc;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#7c3aed;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">AI Summary</p>
                <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${aiSummary}</p>
              </div>`
                  : ""
              }

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${joinUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                      Join Conversation →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
                This link expires in 72 hours · Only you can access this conversation
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                You're receiving this because you have Human Handoff enabled on <strong>${assistantName}</strong>.
                You can disable it in your assistant's Agent settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail(
    ownerEmail,
    `[Action Required] Visitor needs human support — ${assistantName}`,
    html
  );
}
