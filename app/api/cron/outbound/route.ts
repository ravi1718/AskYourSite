import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { sendWhatsApp } from '@/lib/outbound/whatsapp';

/**
 * GET /api/cron/outbound
 * Runs hourly (Vercel Cron). Sends autonomous outbound messages for:
 * 1. Leads captured > 8h ago with no activation (no second session yet)
 * 2. Leads with phone > 24h ago + email already sent
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Find leads captured > 8h ago that haven't received any outbound yet
  const { data: abandonedLeads } = await db
    .from('leads')
    .select('id, email, name, phone, assistant_id, created_at')
    .lt('created_at', eightHoursAgo)
    .not('id', 'in', `(
      SELECT DISTINCT om.to_address FROM outbound_messages om WHERE om.triggered_by = 'abandoned_lead'
    )`);

  let emailsSent = 0;
  let wasSent = 0;

  for (const lead of (abandonedLeads || [])) {
    if (!lead.email || !lead.assistant_id) continue;

    // Get assistant name for the email
    const { data: assistant } = await db
      .from('assistants')
      .select('name, website_url')
      .eq('id', lead.assistant_id)
      .single();

    const botName = assistant?.name || 'Your AI assistant';
    const greeting = lead.name ? `Hey ${lead.name}!` : 'Hey there!';
    const subject = `${greeting} Still have questions about ${botName}?`;
    const html = `
      <p>${greeting}</p>
      <p>You chatted with <strong>${botName}</strong> earlier and we noticed you might still have questions.</p>
      <p>I'm here to help — just reply to this email or come back and chat anytime.</p>
      <p style="margin-top:24px;">Best,<br/>${botName}</p>
    `;

    await sendEmail(lead.email, subject, html);
    await db.from('outbound_messages').insert({
      assistant_id: lead.assistant_id,
      channel: 'email',
      to_address: lead.email,
      subject,
      body: html,
      triggered_by: 'abandoned_lead',
    });
    emailsSent++;

    // 2. Send WhatsApp if phone exists and 24h have passed
    if (lead.phone && lead.created_at < twentyFourHoursAgo) {
      const waResult = await sendWhatsApp(
        lead.phone,
        `${greeting} You chatted with ${botName} yesterday. Still have questions? Just reply here!`
      );
      if (waResult.ok) {
        await db.from('outbound_messages').insert({
          assistant_id: lead.assistant_id,
          channel: 'whatsapp',
          to_address: lead.phone,
          body: `Re-engagement WhatsApp for lead ${lead.email}`,
          triggered_by: 'abandoned_lead_whatsapp',
        });
        wasSent++;
      }
    }
  }

  return NextResponse.json({ ok: true, emailsSent, wasSent });
}
