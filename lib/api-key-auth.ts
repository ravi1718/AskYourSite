import crypto from "crypto";
import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Verifies the API key from the Authorization header.
 * Reads: Authorization: Bearer ask_live_xxxx
 * SHA-256 hashes the key, looks up the api_keys table, checks is_active.
 * Updates last_used_at on each successful auth.
 * Returns { userId } or null.
 */
export async function verifyApiKey(
  req: NextRequest
): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7).trim();
  if (!key.startsWith("ask_live_")) return null;

  const hash = crypto.createHash("sha256").update(key).digest("hex");

  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .single();

  if (!data) return null;

  // Update last_used_at non-blocking
  admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return { userId: data.user_id };
}

/**
 * Generates a new API key string.
 * Returns { key, hash, prefix }.
 * Only key is returned to the user (once). Store hash + prefix.
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const random = crypto.randomBytes(24).toString("base64url").slice(0, 32);
  const key = `ask_live_${random}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.slice(0, 15);
  return { key, hash, prefix };
}
