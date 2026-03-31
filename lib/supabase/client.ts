"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const { url, anonKey, configured } = getSupabaseEnv();

  if (!configured) {
    return null;
  }

  if (!client) {
    client = createBrowserClient(url!, anonKey!);
  }

  return client;
}
