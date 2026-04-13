/**
 * WhatsApp Business Cloud API (Meta)
 * Requires:
 *   WHATSAPP_API_TOKEN       — permanent system user token
 *   WHATSAPP_PHONE_NUMBER_ID — phone number ID from Meta Business Manager
 */
export async function sendWhatsApp(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    return { ok: false, error: 'WhatsApp credentials not configured' };
  }

  // Normalize: strip non-digits, ensure country code prefix
  const normalized = to.replace(/\D/g, '');
  if (normalized.length < 10) return { ok: false, error: 'Invalid phone number' };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalized,
          type: 'text',
          text: { body: message },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
