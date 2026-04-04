import crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";

function verifySignature(rawBody: string, header: string): boolean {
  if (!process.env.CALENDLY_WEBHOOK_SIGNING_KEY) return false;
  try {
    const parts = Object.fromEntries(
      header.split(",").map((part) => {
        const idx = part.indexOf("=");
        return [part.substring(0, idx), part.substring(idx + 1)];
      })
    );
    const toSign = `${parts.t}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", process.env.CALENDLY_WEBHOOK_SIGNING_KEY)
      .update(toSign)
      .digest("hex");
    return parts.v1 === expected;
  } catch {
    return false;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

function visitorConfirmationHtml(params: {
  inviteeName: string;
  eventName: string;
  startTime: string;
  joinUrl: string | null;
}): string {
  const { inviteeName, eventName, startTime, joinUrl } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Meeting Confirmed</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">⚡ AskYourSite</span>
        </td></tr>
        <tr><td style="background:#111827;border:1px solid #1e293b;border-radius:16px;padding:40px 36px;">
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#f8fafc;">Your meeting is confirmed! ✅</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;">Hi ${inviteeName}, we look forward to speaking with you.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">📅 <strong style="color:#f8fafc;">${eventName}</strong></td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">🕐 ${formatDate(startTime)}</td></tr>
            ${joinUrl ? `<tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">🔗 <a href="${joinUrl}" style="color:#3b82f6;">${joinUrl}</a></td></tr>` : ""}
          </table>
          ${joinUrl ? `<a href="${joinUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:100px;">Join Meeting</a>` : ""}
        </td></tr>
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">Powered by AskYourSite · <a href="https://askyoursite.in" style="color:#3b82f6;">askyoursite.in</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function adminNotificationHtml(params: {
  inviteeName: string;
  inviteeEmail: string;
  eventName: string;
  startTime: string;
  joinUrl: string | null;
}): string {
  const { inviteeName, inviteeEmail, eventName, startTime, joinUrl } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>New Booking</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">⚡ AskYourSite</span>
        </td></tr>
        <tr><td style="background:#111827;border:1px solid #1e293b;border-radius:16px;padding:40px 36px;">
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#f8fafc;">New booking via your AI assistant 🎉</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;">Someone booked a meeting through your chat widget.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">👤 <strong style="color:#f8fafc;">${inviteeName}</strong> (${inviteeEmail})</td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">📅 <strong style="color:#f8fafc;">${eventName}</strong></td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">🕐 ${formatDate(startTime)}</td></tr>
            ${joinUrl ? `<tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">🔗 <a href="${joinUrl}" style="color:#3b82f6;">${joinUrl}</a></td></tr>` : ""}
          </table>
          ${joinUrl ? `<a href="${joinUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:100px;">Join Meeting</a>` : ""}
        </td></tr>
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">AskYourSite · <a href="https://askyoursite.in" style="color:#3b82f6;">askyoursite.in</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("Calendly-Webhook-Signature") ?? "";

  if (!verifySignature(rawBody, sig)) {
    console.warn("[calendly-webhook] Invalid signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle new bookings
  if (event.event !== "invitee.created") {
    return Response.json({ ok: true });
  }

  const invitee = event.payload?.invitee;
  const eventInfo = event.payload?.event;
  const orgUri: string = event.payload?.organization ?? "";

  if (!invitee || !eventInfo) {
    return Response.json({ ok: true });
  }

  const inviteeName: string = invitee.name ?? "Visitor";
  const inviteeEmail: string = invitee.email ?? "";
  const eventName: string = eventInfo.name ?? "Meeting";
  const startTime: string = eventInfo.start_time ?? "";
  const joinUrl: string | null = eventInfo.location?.join_url ?? null;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.error("[calendly-webhook] Admin client not initialized");
    return Response.json({ ok: true });
  }

  // Find the AskYourSite user whose Calendly organization matches
  const { data: integration } = await admin
    .from("user_integrations")
    .select("user_id")
    .eq("provider", "calendly")
    .filter("metadata->organization", "eq", orgUri)
    .maybeSingle();

  if (!integration?.user_id) {
    console.warn("[calendly-webhook] No matching integration for org:", orgUri);
    return Response.json({ ok: true });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", integration.user_id)
    .single();

  const emailParams = { inviteeName, inviteeEmail, eventName, startTime, joinUrl };

  const tasks: Promise<void>[] = [];

  if (inviteeEmail) {
    tasks.push(
      sendEmail(
        inviteeEmail,
        `Your ${eventName} is confirmed!`,
        visitorConfirmationHtml(emailParams)
      )
    );
  }

  if (profile?.email) {
    tasks.push(
      sendEmail(
        profile.email,
        `New booking: ${inviteeName} scheduled ${eventName}`,
        adminNotificationHtml(emailParams)
      )
    );
  }

  await Promise.all(tasks);
  console.log(`[calendly-webhook] Processed booking: ${inviteeName} (${inviteeEmail}) → ${eventName}`);

  return Response.json({ ok: true });
}
