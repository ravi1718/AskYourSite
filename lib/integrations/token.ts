import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";

interface UserIntegration {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;       // encrypted
  refresh_token: string | null; // encrypted
  token_expires_at: string | null;
  metadata: Record<string, any>;
}

interface TokenRefreshConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  /**
   * Some providers (HubSpot) need client_id + client_secret in body.
   * Google uses them in body too. Airtable uses Basic auth.
   */
  authMode: "body" | "basic";
}

const REFRESH_CONFIGS: Record<string, TokenRefreshConfig> = {
  google: {
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
    authMode: "body",
  },
  hubspot: {
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    clientId: process.env.HUBSPOT_CLIENT_ID ?? "",
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET ?? "",
    authMode: "body",
  },
  airtable: {
    tokenUrl: "https://airtable.com/oauth2/v1/token",
    clientId: process.env.AIRTABLE_CLIENT_ID ?? "",
    clientSecret: process.env.AIRTABLE_CLIENT_SECRET ?? "",
    authMode: "basic",
  },
};

/**
 * Returns a valid (non-expired) access token for the given integration.
 * If the token has expired (or will expire within 5 minutes), refreshes it
 * automatically and updates the DB row.
 */
export async function getValidAccessToken(integration: UserIntegration): Promise<string> {
  const now = Date.now();
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : null;
  const bufferMs = 5 * 60 * 1000; // refresh 5 minutes before expiry

  // Token still valid
  if (expiresAt && now < expiresAt - bufferMs) {
    return decrypt(integration.access_token);
  }

  // No refresh token — return current token as-is (Notion pattern: never expires)
  if (!integration.refresh_token) {
    return decrypt(integration.access_token);
  }

  const config = REFRESH_CONFIGS[integration.provider];
  if (!config) {
    return decrypt(integration.access_token);
  }

  // Refresh the token
  const refreshToken = decrypt(integration.refresh_token);
  let headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  let body: URLSearchParams;

  if (config.authMode === "basic") {
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
    body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
  } else {
    body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });
  }

  const res = await fetch(config.tokenUrl, { method: "POST", headers, body });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[token] Refresh failed for ${integration.provider}: ${err}`);
  }

  const tokens = await res.json();
  const newAccessToken: string = tokens.access_token;
  // Some providers don't return a new refresh_token — keep the old one
  const newRefreshToken: string | null = tokens.refresh_token ?? null;
  const expiresIn: number | null = tokens.expires_in ?? null;
  const newExpiresAt = expiresIn ? new Date(now + expiresIn * 1000).toISOString() : null;

  const admin = getSupabaseAdminClient();
  if (admin) {
    await admin.from("user_integrations").update({
      access_token: encrypt(newAccessToken),
      ...(newRefreshToken ? { refresh_token: encrypt(newRefreshToken) } : {}),
      ...(newExpiresAt ? { token_expires_at: newExpiresAt } : {}),
      updated_at: new Date().toISOString(),
    }).eq("id", integration.id);
  }

  return newAccessToken;
}
